-- ============================================================
-- Fit-Manager — course archiving.
-- Archived courses stay in the database (history, registrations) but are
-- hidden from the normal portal views (Kurse, Stundenplan, Dashboard).
-- Only the Admin "Kursverwaltung" page shows and toggles them.
-- ============================================================
alter table public.courses
  add column if not exists archived boolean not null default false;

create index if not exists idx_courses_archived on public.courses (archived);
