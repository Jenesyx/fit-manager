import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Current user's profile, or null if not signed in / no profile yet. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/** Require a signed-in profile or redirect to login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/anmelden");
  return profile;
}

/** Require one of the given roles, else redirect to the dashboard. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/portal/dashboard");
  return profile;
}

/** Whether a profile may create/manage courses. */
export function canManageCourses(profile: Profile): boolean {
  return (
    profile.role === "admin" ||
    (profile.role === "trainer" && profile.can_create_courses)
  );
}
