-- ============================================================
-- Fit-Manager — seed reference data (Standorte + Räume)
-- Safe to run repeatedly. Runs automatically with `supabase db reset`.
-- ============================================================

insert into public.locations (id, name, city) values
  ('11111111-1111-1111-1111-111111111111', 'Fit & Aktiv Mitte',            'Berlin'),
  ('22222222-2222-2222-2222-222222222222', 'Fit & Aktiv Kreuzberg',        'Berlin'),
  ('33333333-3333-3333-3333-333333333333', 'Fit & Aktiv Prenzlauer Berg',  'Berlin'),
  ('44444444-4444-4444-4444-444444444444', 'Fit & Aktiv Charlottenburg',   'Berlin')
on conflict (id) do nothing;

insert into public.rooms (location_id, name, capacity) values
  ('11111111-1111-1111-1111-111111111111', 'Studio A', 24),
  ('11111111-1111-1111-1111-111111111111', 'Studio B', 18),
  ('11111111-1111-1111-1111-111111111111', 'Kraftraum', 12),
  ('22222222-2222-2222-2222-222222222222', 'Studio A', 20),
  ('22222222-2222-2222-2222-222222222222', 'Cycling-Raum', 16),
  ('33333333-3333-3333-3333-333333333333', 'Studio A', 22),
  ('33333333-3333-3333-3333-333333333333', 'Yoga-Raum', 14),
  ('44444444-4444-4444-4444-444444444444', 'Studio A', 26),
  ('44444444-4444-4444-4444-444444444444', 'Functional-Area', 16)
on conflict (location_id, name) do nothing;

-- ============================================================
-- Promote the first admin AFTER you have signed up via the app:
--
--   update public.profiles
--   set role = 'admin', can_create_courses = true
--   where email = 'a.bidkhori2004@gmail.com';
--
-- To make a trainer able to create courses:
--   update public.profiles set role='trainer', can_create_courses=true where email='...';
-- ============================================================
