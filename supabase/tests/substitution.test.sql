-- ============================================================
-- Fit-Manager — unit test for handle_sick_leave()
-- Run against a local DB:  psql "$DATABASE_URL" -f supabase/tests/substitution.test.sql
-- Wrapped in a transaction that always rolls back (no data is persisted).
-- session_replication_role=replica disables triggers + FK checks so we can
-- seed profiles directly without auth.users rows.
-- ============================================================
begin;
set local session_replication_role = replica;

-- Trainers
insert into public.profiles (id, full_name, role, can_create_courses) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'T1 Sick',   'trainer', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'T2 Free',   'trainer', true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'T3 Busy',   'trainer', true);

-- Courses for T1
insert into public.courses (id, name, date, start_time, end_time, trainer_id, status) values
  -- C1: in window, substitute available
  ('cccccccc-0000-0000-0000-000000000001', 'C1 vertretbar', current_date + 2, '10:00', '11:00',
     'aaaaaaaa-0000-0000-0000-000000000001', 'regulaer'),
  -- C2: in window, but the only other trainer (T3) is busy at that slot
  ('cccccccc-0000-0000-0000-000000000002', 'C2 abgesagt',  current_date + 3, '18:00', '19:00',
     'aaaaaaaa-0000-0000-0000-000000000001', 'regulaer'),
  -- C3: outside the 2-week horizon → must stay untouched
  ('cccccccc-0000-0000-0000-000000000003', 'C3 ausserhalb', current_date + 30, '10:00', '11:00',
     'aaaaaaaa-0000-0000-0000-000000000001', 'regulaer');

-- Make T2 unavailable for C2's slot only (busy teaching), so only T3 could cover C2,
-- and make T3 also busy at C2's slot → no substitute for C2.
insert into public.courses (id, name, date, start_time, end_time, trainer_id, status) values
  ('dddddddd-0000-0000-0000-000000000001', 'T2 busy', current_date + 3, '18:00', '19:00',
     'aaaaaaaa-0000-0000-0000-000000000002', 'regulaer'),
  ('dddddddd-0000-0000-0000-000000000002', 'T3 busy', current_date + 3, '18:00', '19:00',
     'aaaaaaaa-0000-0000-0000-000000000003', 'regulaer');

-- Act: T1 is sick for the next 10 days
select public.handle_sick_leave(
  'aaaaaaaa-0000-0000-0000-000000000001',
  current_date,
  current_date + 10
);

-- Assert
do $$
declare
  s1 public.course_status;
  sub1 uuid;
  s2 public.course_status;
  reason2 text;
  s3 public.course_status;
begin
  select status, substitute_trainer_id into s1, sub1
    from public.courses where id = 'cccccccc-0000-0000-0000-000000000001';
  select status, cancel_reason into s2, reason2
    from public.courses where id = 'cccccccc-0000-0000-0000-000000000002';
  select status into s3
    from public.courses where id = 'cccccccc-0000-0000-0000-000000000003';

  assert s1 = 'vertreten',  'C1 should be vertreten, got ' || s1;
  assert sub1 = 'aaaaaaaa-0000-0000-0000-000000000002', 'C1 substitute should be T2';
  assert s2 = 'abgesagt',   'C2 should be abgesagt, got ' || s2;
  assert reason2 = 'keine Vertretung verfügbar', 'C2 reason wrong: ' || coalesce(reason2,'NULL');
  assert s3 = 'regulaer',   'C3 (outside window) should stay regulaer, got ' || s3;

  raise notice 'OK — all substitution assertions passed';
end $$;

rollback;
