-- ============================================================
-- Fix: when a substitute trainer also calls in sick,
-- re-run substitution on courses where they are the substitute.
-- Replaces handle_sick_leave with an extended version.
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

  -- ── Loop 1: courses where this trainer is the PRIMARY trainer ──────────
  -- (same as before: status must be 'regulaer')
  for c in
    select co.id, co.name, co.date, co.start_time, co.end_time, r.location_id
    from public.courses co
    left join public.rooms r on r.id = co.room_id
    where co.trainer_id = p_trainer
      and co.status = 'regulaer'
      and co.date between greatest(p_start, current_date) and least(p_end, win_end)
    order by co.date, co.start_time
  loop
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

  -- ── Loop 2: courses where this trainer is the SUBSTITUTE ───────────────
  -- The original trainer already called in sick (status = 'vertreten').
  -- Now the substitute is also sick → try to find a third trainer, else cancel.
  for c in
    select co.id, co.date, co.start_time, co.end_time,
           co.original_trainer_id, r.location_id
    from public.courses co
    left join public.rooms r on r.id = co.room_id
    where co.substitute_trainer_id = p_trainer
      and co.status = 'vertreten'
      and co.date between greatest(p_start, current_date) and least(p_end, win_end)
    order by co.date, co.start_time
  loop
    select p.id into v_sub_id
    from public.profiles p
    where p.id <> p_trainer
      -- exclude the original trainer who is already sick
      and (c.original_trainer_id is null or p.id <> c.original_trainer_id)
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
        substitute_trainer_id = v_sub_id,
        cancel_reason         = null
      where id = c.id;
      -- status stays 'vertreten', original_trainer_id unchanged
    else
      update public.courses set
        status                = 'abgesagt',
        substitute_trainer_id = null,
        cancel_reason         = 'keine Vertretung verfügbar'
      where id = c.id;
    end if;

    v_sub_id := null;
  end loop;

end $$;
