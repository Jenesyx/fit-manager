-- ============================================================
-- Fit-Manager — room occupancy ("belegt") + capacity guarantees.
--
-- These run at the DATABASE level, so the rules hold no matter where a
-- write comes from (form, API, substitution trigger, manual SQL):
--   1. A room can host only ONE active course per overlapping time slot.
--      Cancelled (abgesagt) courses free the room again.
--   2. A course's max participants may never exceed the room's capacity.
--   3. A Kunde can only register while there are free Plätze; a full course
--      is "ausgebucht", and registering for a cancelled course is rejected.
-- ============================================================

-- ---------- 1 + 2: room double-booking & capacity (on courses) ----------
create or replace function public.enforce_room_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_cap int;
begin
  if new.room_id is not null then
    -- (2) capacity: course limit must fit the room
    select capacity into v_cap from public.rooms where id = new.room_id;
    if v_cap is not null and new.max_participants > v_cap then
      raise exception
        'Teilnehmerzahl (%) überschreitet die Raumkapazität (%).',
        new.max_participants, v_cap;
    end if;

    -- (1) occupancy: no overlapping active course in the same room
    if new.status <> 'abgesagt' and exists (
      select 1
      from public.courses o
      where o.room_id = new.room_id
        and o.id      <> new.id
        and o.date     = new.date
        and o.status  <> 'abgesagt'
        and o.start_time < new.end_time
        and o.end_time   > new.start_time
    ) then
      raise exception 'Raum ist zu dieser Zeit bereits belegt.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_room_rules on public.courses;
create trigger trg_room_rules
  before insert or update on public.courses
  for each row execute function public.enforce_room_rules();

-- ---------- 3: registration capacity (on course_registrations) ----------
-- SECURITY DEFINER so the head-count sees ALL rows (RLS would otherwise
-- limit a Kunde to counting only their own registration → under-count).
create or replace function public.enforce_course_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_max    int;
  v_status public.course_status;
  v_count  int;
begin
  select max_participants, status into v_max, v_status
  from public.courses where id = new.course_id;

  if v_status = 'abgesagt' then
    raise exception 'Dieser Kurs ist abgesagt — eine Anmeldung ist nicht möglich.';
  end if;

  select count(*) into v_count
  from public.course_registrations where course_id = new.course_id;

  if v_count >= v_max then
    raise exception 'Dieser Kurs ist bereits ausgebucht (% Plätze).', v_max;
  end if;

  return new;
end $$;

drop trigger if exists trg_course_capacity on public.course_registrations;
create trigger trg_course_capacity
  before insert on public.course_registrations
  for each row execute function public.enforce_course_capacity();

-- ---------- Read helper: how full is each course? ----------
-- SECURITY DEFINER so every user (incl. Kunden) can see total fill, while
-- the underlying course_registrations rows stay private under RLS.
create or replace function public.get_course_registration_counts(p_ids uuid[])
returns table (course_id uuid, registered bigint)
language sql stable security definer set search_path = public as $$
  select cr.course_id, count(*)::bigint
  from public.course_registrations cr
  where cr.course_id = any(p_ids)
  group by cr.course_id;
$$;

revoke all on function public.get_course_registration_counts(uuid[]) from public;
grant execute on function public.get_course_registration_counts(uuid[]) to authenticated;
