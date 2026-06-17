-- ============================================================
-- Fit-Manager — schema
-- Roles: kunde | trainer | admin. Courses planned for the next 2 weeks.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type public.user_role as enum ('kunde', 'trainer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.course_status as enum ('regulaer', 'vertreten', 'abgesagt');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Locations (Standorte) ----------
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null default 'Berlin',
  created_at  timestamptz not null default now()
);

-- ---------- Rooms (Räume) ----------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.locations(id) on delete cascade,
  name         text not null,
  capacity     int  not null default 20,
  created_at   timestamptz not null default now(),
  unique (location_id, name)
);

-- ---------- Profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null default '',
  email               text,
  role                public.user_role not null default 'kunde',
  can_create_courses  boolean not null default false,
  home_location_id    uuid references public.locations(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Courses (Kurse) ----------
create table if not exists public.courses (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  description            text,
  date                   date not null,
  start_time             time not null,
  end_time               time not null,
  room_id                uuid references public.rooms(id) on delete set null,
  trainer_id             uuid references public.profiles(id) on delete set null,
  max_participants       int  not null default 20,
  status                 public.course_status not null default 'regulaer',
  original_trainer_id    uuid references public.profiles(id) on delete set null,
  substitute_trainer_id  uuid references public.profiles(id) on delete set null,
  cancel_reason          text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint chk_course_times check (end_time > start_time)
);

create index if not exists idx_courses_date on public.courses (date);
create index if not exists idx_courses_trainer on public.courses (trainer_id);

create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------- Sick leaves (Krankmeldungen) ----------
create table if not exists public.sick_leaves (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint chk_sick_dates check (end_date >= start_date)
);

create index if not exists idx_sick_leaves_trainer on public.sick_leaves (trainer_id);

-- ---------- Course registrations (Kundenanmeldungen) ----------
create table if not exists public.course_registrations (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  kunde_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (course_id, kunde_id)
);

-- ---------- Auto-create profile on signup (default role: kunde) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'kunde'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
