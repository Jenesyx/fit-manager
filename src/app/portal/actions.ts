"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { isWithinHorizon } from "@/lib/dates";
import type { CourseStatus, UserRole } from "@/lib/database.types";

export type ActionState = { error?: string; message?: string };

// ---------- Kurs erstellen ----------
export async function createCourseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) return { error: "Nicht angemeldet." };
  const allowed =
    profile.role === "admin" ||
    (profile.role === "trainer" && profile.can_create_courses);
  if (!allowed) return { error: "Keine Berechtigung, Kurse zu erstellen." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const room_id = String(formData.get("room_id") ?? "") || null;
  const trainer_id = String(formData.get("trainer_id") ?? "") || null;
  const max_participants = Number(formData.get("max_participants") ?? 20);
  const status = (String(formData.get("status") ?? "regulaer") ||
    "regulaer") as CourseStatus;

  if (!name || !date || !start_time || !end_time)
    return { error: "Bitte fülle alle Pflichtfelder aus." };
  if (end_time <= start_time)
    return { error: "Die Endzeit muss nach der Startzeit liegen." };
  if (!isWithinHorizon(date))
    return {
      error: "Kurse können nur für die nächsten zwei Wochen geplant werden.",
    };

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({
    name,
    description,
    date,
    start_time,
    end_time,
    room_id,
    trainer_id,
    max_participants: Number.isFinite(max_participants) ? max_participants : 20,
    status,
  });
  if (error) return { error: "Kurs konnte nicht gespeichert werden." };

  revalidatePath("/portal/stundenplan");
  revalidatePath("/portal/kurse");
  revalidatePath("/portal/dashboard");
  return { message: `Kurs „${name}“ wurde angelegt.` };
}

// ---------- Krankmeldung ----------
export type SickLeaveResult = {
  course_id: string;
  course_name: string;
  course_date: string;
  start_time: string;
  end_time: string;
  status: CourseStatus;
  substitute_name: string | null;
  cancel_reason: string | null;
};

export type SickLeaveState = ActionState & { results?: SickLeaveResult[] };

export async function submitSickLeaveAction(
  _prev: SickLeaveState,
  formData: FormData,
): Promise<SickLeaveState> {
  const profile = await getProfile();
  if (!profile) return { error: "Nicht angemeldet." };
  if (profile.role !== "trainer" && profile.role !== "admin")
    return { error: "Nur Trainer können Krankmeldungen erfassen." };

  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!start_date || !end_date)
    return { error: "Bitte gib Start- und Enddatum an." };
  if (end_date < start_date)
    return { error: "Das Enddatum darf nicht vor dem Startdatum liegen." };

  const supabase = await createClient();
  const { error } = await supabase.from("sick_leaves").insert({
    trainer_id: profile.id,
    start_date,
    end_date,
    reason,
  });
  if (error)
    return { error: "Krankmeldung konnte nicht gespeichert werden." };

  // The AFTER INSERT trigger already ran the substitution; read the outcome.
  const { data: results } = await supabase.rpc("get_sick_leave_result", {
    p_trainer: profile.id,
    p_start: start_date,
    p_end: end_date,
  });

  revalidatePath("/portal/stundenplan");
  revalidatePath("/portal/dashboard");
  return {
    message: "Krankmeldung gespeichert. Die automatische Prüfung ist abgeschlossen.",
    results: (results as SickLeaveResult[]) ?? [],
  };
}

// ---------- Trainerverwaltung (admin) ----------
export async function updateUserRoleAction(
  formData: FormData,
): Promise<void> {
  const profile = await getProfile();
  if (profile?.role !== "admin") return;

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const canCreate = formData.get("can_create_courses") === "on";
  if (!userId) return;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      role,
      can_create_courses: role === "trainer" ? canCreate : role === "admin",
    })
    .eq("id", userId);

  revalidatePath("/portal/trainer");
}

// ---------- Kursanmeldung (kunde) ----------
export async function registerForCourseAction(
  formData: FormData,
): Promise<void> {
  const profile = await getProfile();
  if (!profile) return;
  const courseId = String(formData.get("course_id") ?? "");
  if (!courseId) return;

  const supabase = await createClient();
  await supabase
    .from("course_registrations")
    .insert({ course_id: courseId, kunde_id: profile.id });
  revalidatePath("/portal/kurse");
}

export async function unregisterFromCourseAction(
  formData: FormData,
): Promise<void> {
  const profile = await getProfile();
  if (!profile) return;
  const courseId = String(formData.get("course_id") ?? "");
  if (!courseId) return;

  const supabase = await createClient();
  await supabase
    .from("course_registrations")
    .delete()
    .eq("course_id", courseId)
    .eq("kunde_id", profile.id);
  revalidatePath("/portal/kurse");
}

// ---------- Einstellungen ----------
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) return { error: "Nicht angemeldet." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) return { error: "Bitte gib deinen Namen ein." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", profile.id);
  if (error) return { error: "Profil konnte nicht aktualisiert werden." };

  revalidatePath("/portal", "layout");
  return { message: "Profil gespeichert." };
}
