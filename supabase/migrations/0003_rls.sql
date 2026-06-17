-- ============================================================
-- Fit-Manager — Row Level Security
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.locations           enable row level security;
alter table public.rooms               enable row level security;
alter table public.courses             enable row level security;
alter table public.sick_leaves         enable row level security;
alter table public.course_registrations enable row level security;

-- ---------- Prevent privilege escalation on profiles ----------
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.can_create_courses is distinct from old.can_create_courses)
     and not public.is_admin() then
    raise exception 'Nur Admins dürfen Rolle oder Kursrechte ändern';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile on public.profiles;
create trigger trg_guard_profile
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------- profiles ----------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- locations ----------
drop policy if exists "locations_read" on public.locations;
create policy "locations_read" on public.locations
  for select using (auth.uid() is not null);

drop policy if exists "locations_write" on public.locations;
create policy "locations_write" on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- rooms ----------
drop policy if exists "rooms_read" on public.rooms;
create policy "rooms_read" on public.rooms
  for select using (auth.uid() is not null);

drop policy if exists "rooms_write" on public.rooms;
create policy "rooms_write" on public.rooms
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- courses ----------
drop policy if exists "courses_read" on public.courses;
create policy "courses_read" on public.courses
  for select using (auth.uid() is not null);

drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses
  for insert with check (public.can_manage_courses());

drop policy if exists "courses_update" on public.courses;
create policy "courses_update" on public.courses
  for update using (public.can_manage_courses()) with check (public.can_manage_courses());

drop policy if exists "courses_delete" on public.courses;
create policy "courses_delete" on public.courses
  for delete using (public.can_manage_courses());

-- ---------- sick_leaves ----------
drop policy if exists "sick_select" on public.sick_leaves;
create policy "sick_select" on public.sick_leaves
  for select using (trainer_id = auth.uid() or public.is_admin());

drop policy if exists "sick_insert" on public.sick_leaves;
create policy "sick_insert" on public.sick_leaves
  for insert with check (trainer_id = auth.uid());

-- ---------- course_registrations ----------
drop policy if exists "reg_select" on public.course_registrations;
create policy "reg_select" on public.course_registrations
  for select using (kunde_id = auth.uid() or public.is_admin());

drop policy if exists "reg_insert" on public.course_registrations;
create policy "reg_insert" on public.course_registrations
  for insert with check (kunde_id = auth.uid());

drop policy if exists "reg_delete" on public.course_registrations;
create policy "reg_delete" on public.course_registrations
  for delete using (kunde_id = auth.uid());
