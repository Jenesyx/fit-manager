-- ============================================================
-- Fit-Manager — extend room rules trigger to also block
-- trainer double-booking (same trainer, overlapping time slot).
-- ============================================================

create or replace function public.enforce_room_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_cap int;
begin
  if new.room_id is not null then
    -- capacity: course limit must fit the room
    select capacity into v_cap from public.rooms where id = new.room_id;
    if v_cap is not null and new.max_participants > v_cap then
      raise exception
        'Teilnehmerzahl (%) überschreitet die Raumkapazität (%).',
        new.max_participants, v_cap;
    end if;

    -- room occupancy: no two active courses in the same room at the same time
    if new.status <> 'abgesagt' and exists (
      select 1 from public.courses o
      where o.room_id   = new.room_id
        and o.id       <> new.id
        and o.date      = new.date
        and o.status   <> 'abgesagt'
        and o.start_time < new.end_time
        and o.end_time   > new.start_time
    ) then
      raise exception 'Raum ist zu dieser Zeit bereits belegt.';
    end if;
  end if;

  -- trainer occupancy: a trainer can only run one active course per slot
  if new.trainer_id is not null and new.status <> 'abgesagt' and exists (
    select 1 from public.courses o
    where o.trainer_id = new.trainer_id
      and o.id        <> new.id
      and o.date       = new.date
      and o.status    <> 'abgesagt'
      and o.start_time < new.end_time
      and o.end_time   > new.start_time
  ) then
    raise exception 'Trainer ist zu dieser Zeit bereits belegt.';
  end if;

  return new;
end $$;

-- Trigger already exists from 0006; replace function is enough.
-- Re-create to be explicit (idempotent).
drop trigger if exists trg_room_rules on public.courses;
create trigger trg_room_rules
  before insert or update on public.courses
  for each row execute function public.enforce_room_rules();
