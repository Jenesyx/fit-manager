-- ============================================================
-- Fit-Manager — role helpers + automatic substitution logic
-- ============================================================

-- ---------- Role helpers (SECURITY DEFINER → safe inside RLS, no recursion) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_manage_courses()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or (role = 'trainer' and can_create_courses))
  );
$$;

-- ============================================================
-- handle_sick_leave: when a trainer is sick, for each of their regular
-- courses inside the sick window AND inside the next-2-weeks horizon,
-- try to find a free substitute. Assign → 'vertreten', else → 'abgesagt'
-- with reason "keine Vertretung verfügbar".
-- Runs with definer rights so the trigger works regardless of caller RLS.
-- ============================================================
create or replace function public.handle_sick_leave(
  p_trainer uuid,
  p_start   date,
  p_end     date
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c        record;
  v_sub_id uuid;
  win_end  date := current_date + interval '13 days';
begin
  for c in
    select co.id, co.name, co.date, co.start_time, co.end_time, r.location_id
    from public.courses co
    left join public.rooms r on r.id = co.room_id
    where co.trainer_id = p_trainer
      and co.status = 'regulaer'
      and co.date between greatest(p_start, current_date) and least(p_end, win_end)
    order by co.date, co.start_time
  loop
    -- find a free substitute trainer/admin for this exact slot
    select p.id into v_sub_id
    from public.profiles p
    where p.id <> p_trainer
      and p.role in ('trainer', 'admin')
      and not exists (
        select 1 from public.sick_leaves s
        where s.trainer_id = p.id
          and c.date between s.start_date and s.end_date
      )
      and not exists (
        select 1 from public.courses o
        where o.date = c.date
          and o.status <> 'abgesagt'
          and o.id <> c.id
          and (o.trainer_id = p.id or o.substitute_trainer_id = p.id)
          and o.start_time < c.end_time
          and o.end_time > c.start_time
      )
    order by
      (p.home_location_id is not distinct from c.location_id) desc,
      p.full_name
    limit 1;

    if v_sub_id is not null then
      update public.courses set
        status                = 'vertreten',
        original_trainer_id   = coalesce(original_trainer_id, p_trainer),
        substitute_trainer_id = v_sub_id,
        cancel_reason         = null
      where id = c.id;
    else
      update public.courses set
        status                = 'abgesagt',
        original_trainer_id   = coalesce(original_trainer_id, p_trainer),
        substitute_trainer_id = null,
        cancel_reason         = 'keine Vertretung verfügbar'
      where id = c.id;
    end if;

    v_sub_id := null;
  end loop;
end $$;

-- ---------- Trigger: run substitution automatically on new sick leave ----------
create or replace function public.on_sick_leave_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.handle_sick_leave(new.trainer_id, new.start_date, new.end_date);
  return new;
end $$;

drop trigger if exists trg_sick_leave_after_insert on public.sick_leaves;
create trigger trg_sick_leave_after_insert
  after insert on public.sick_leaves
  for each row execute function public.on_sick_leave_insert();

-- ============================================================
-- get_sick_leave_result: read-only view of what happened to a trainer's
-- courses in a window — used by the Krankmeldung page to render the
-- "Ergebnis der automatischen Prüfung". Caller must be the trainer or an admin.
-- ============================================================
create or replace function public.get_sick_leave_result(
  p_trainer uuid,
  p_start   date,
  p_end     date
)
returns table (
  course_id       uuid,
  course_name     text,
  course_date     date,
  start_time      time,
  end_time        time,
  status          public.course_status,
  substitute_name text,
  cancel_reason   text
)
language sql stable security definer set search_path = public as $$
  select
    co.id, co.name, co.date, co.start_time, co.end_time, co.status,
    sub.full_name, co.cancel_reason
  from public.courses co
  left join public.profiles sub on sub.id = co.substitute_trainer_id
  where (co.trainer_id = p_trainer or co.original_trainer_id = p_trainer)
    and co.date between greatest(p_start, current_date)
                    and least(p_end, current_date + interval '13 days')
    and (auth.uid() = p_trainer or public.is_admin())
  order by co.date, co.start_time;
$$;
