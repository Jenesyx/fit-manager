-- Minimal Supabase `auth` shim so migrations can run on a plain Postgres
-- (local SQL testing only — the real auth schema is provided by Supabase).
create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  raw_user_meta_data  jsonb default '{}'::jsonb,
  created_at          timestamptz default now()
);

-- Returns NULL in tests (no logged-in user); good enough since the
-- substitution test disables triggers/RLS via session_replication_role.
create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;
