-- ============================================================
-- Fit-Manager — recurring course series.
-- Courses that belong to a series share a series_id UUID.
-- ============================================================
alter table public.courses
  add column if not exists series_id uuid;

create index if not exists idx_courses_series_id on public.courses (series_id)
  where series_id is not null;
