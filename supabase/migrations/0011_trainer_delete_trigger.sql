-- ============================================================
-- When a trainer/admin profile is deleted, re-run substitution
-- for all their future courses. Fires BEFORE DELETE so we can
-- still query other profiles for conflict checks.
-- ============================================================

create or replace function public.handle_trainer_deleted(p_trainer uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c        record;
  v_sub_id uuid;
begin

  -- ── Case 1: deleted trainer is the PRIMARY trainer (status = 'regulaer') ──
  for c in
    select co.id, co.date, co.start_time, co.end_time, r.location_id
    from public.courses co
    left join public.rooms r on r.id = co.room_id
    where co.trainer_id = p_trainer
      and co.status = 'regulaer'
      and co.date >= current_date
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
        trainer_id            = null,
        original_trainer_id   = coalesce(original_trainer_id, p_trainer),
        substitute_trainer_id = v_sub_id,
        cancel_reason         = null
      where id = c.id;
    else
      update public.courses set
        status                = 'abgesagt',
        trainer_id            = null,
        original_trainer_id   = coalesce(original_trainer_id, p_trainer),
        substitute_trainer_id = null,
        cancel_reason         = 'Trainer nicht mehr verfügbar'
      where id = c.id;
    end if;

    v_sub_id := null;
  end loop;

  -- ── Case 2: deleted trainer is the SUBSTITUTE (status = 'vertreten') ──
  for c in
    select co.id, co.date, co.start_time, co.end_time, co.original_trainer_id, r.location_id
    from public.courses co
    left join public.rooms r on r.id = co.room_id
    where co.substitute_trainer_id = p_trainer
      and co.status = 'vertreten'
      and co.date >= current_date
    order by co.date, co.start_time
  loop
    select p.id into v_sub_id
    from public.profiles p
    where p.id <> p_trainer
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
    else
      update public.courses set
        status                = 'abgesagt',
        substitute_trainer_id = null,
        cancel_reason         = 'Trainer nicht mehr verfügbar'
      where id = c.id;
    end if;

    v_sub_id := null;
  end loop;

end $$;

create or replace function public.on_profile_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role in ('trainer', 'admin') then
    perform public.handle_trainer_deleted(old.id);
  end if;
  return old;
end $$;

drop trigger if exists trg_profile_before_delete on public.profiles;
create trigger trg_profile_before_delete
  before delete on public.profiles
  for each row execute function public.on_profile_delete();
