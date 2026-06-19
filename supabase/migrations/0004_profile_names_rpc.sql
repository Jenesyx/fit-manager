-- ============================================================
-- Fit-Manager — public-facing trainer names on course cards
--
-- The profiles RLS policy only lets a user read their OWN row (or every
-- row, if admin). That meant any *other* user loading the course list got
-- nothing back for the trainer / substitute profile rows, so the cards
-- showed "—" instead of the trainer's name.
--
-- This SECURITY DEFINER helper returns ONLY id + full_name for a given set
-- of ids. It runs with owner rights (bypassing RLS) but exposes no emails,
-- roles, or other profile columns — so every logged-in user can resolve the
-- names shown on a course card, and nothing private leaks.
-- ============================================================
create or replace function public.get_profile_names(p_ids uuid[])
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke all on function public.get_profile_names(uuid[]) from public;
grant execute on function public.get_profile_names(uuid[]) to authenticated;
