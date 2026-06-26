"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, canManageCourses } from "@/lib/auth";
import { isWithinHorizon, seriesHorizonEndISO, generateSeriesDates, timeToMinutes } from "@/lib/dates";
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
  if (profile.role !== "admin" && !isWithinHorizon(date))
    return {
      error: "Kurse können nur für die nächsten zwei Wochen geplant werden.",
    };

  const supabase = await createClient();

  // Room rules (the DB enforces these too — checked here for friendly errors).
  if (room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("capacity")
      .eq("id", room_id)
      .maybeSingle();
    if (room && max_participants > room.capacity)
      return {
        error: `Die Teilnehmerzahl überschreitet die Raumkapazität (${room.capacity} Plätze).`,
      };

    if (status !== "abgesagt") {
      const { data: clash } = await supabase
        .from("courses")
        .select("id")
        .eq("room_id", room_id)
        .eq("date", date)
        .neq("status", "abgesagt")
        .lt("start_time", end_time)
        .gt("end_time", start_time)
        .limit(1);
      if (clash && clash.length > 0)
        return { error: "Raum ist zu dieser Zeit bereits belegt." };
    }
  }

  // Trainer-Konfliktprüfung: gleiches Studio → kein Puffer nötig; anderes Studio → 60 Min. Pause.
  if (trainer_id && status !== "abgesagt") {
    let newLocationId: string | null = null;
    if (room_id) {
      const { data: newRoom } = await supabase
        .from("rooms")
        .select("location_id")
        .eq("id", room_id)
        .maybeSingle();
      newLocationId = newRoom?.location_id ?? null;
    }

    const { data: trainerCourses } = await supabase
      .from("courses")
      .select("start_time, end_time, room_id")
      .eq("trainer_id", trainer_id)
      .eq("date", date)
      .neq("status", "abgesagt");

    if (trainerCourses && trainerCourses.length > 0) {
      const roomIds = [
        ...new Set(trainerCourses.map((c) => c.room_id).filter((id): id is string => id !== null)),
      ];
      const roomLocationMap: Record<string, string> = {};
      if (roomIds.length > 0) {
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, location_id")
          .in("id", roomIds);
        if (rooms) for (const r of rooms) roomLocationMap[r.id] = r.location_id;
      }

      const newS = timeToMinutes(start_time);
      const newE = timeToMinutes(end_time);

      for (const c of trainerCourses) {
        const es = timeToMinutes(c.start_time);
        const ee = timeToMinutes(c.end_time);
        const existingLocId = c.room_id ? (roomLocationMap[c.room_id] ?? null) : null;
        const sameLocation =
          newLocationId !== null && existingLocId !== null && newLocationId === existingLocId;

        if (sameLocation) {
          if (newS < ee && es < newE)
            return { error: "Dieser Trainer ist zu dieser Zeit bereits belegt." };
        } else {
          if (newS < ee + 60 && es < newE + 60)
            return {
              error:
                "Dieser Trainer benötigt mindestens 60 Minuten Pause zwischen Kursen in verschiedenen Studios.",
            };
        }
      }
    }
  }

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
  if (error) {
    // Surface the DB trigger messages (Raum belegt / Kapazität) verbatim.
    const known = /belegt|Raumkapazität|ausgebucht|abgesagt/.test(
      error.message ?? "",
    );
    return {
      error: known ? error.message : "Kurs konnte nicht gespeichert werden.",
    };
  }

  revalidatePath("/portal/stundenplan");
  revalidatePath("/portal/kurse");
  revalidatePath("/portal/dashboard");
  return { message: `Kurs „${name}“ wurde angelegt.` };
}

// ---------- Wiederkehrende Kursserie (admin only) ----------
export type RecurringActionState = ActionState & {
  created?: number;
  skipped?: { date: string; reason: string }[];
};

export async function createRecurringCoursesAction(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const profile = await getProfile();
  if (!profile) return { error: "Nicht angemeldet." };
  if (profile.role !== "admin")
    return { error: "Nur Admins können Serien anlegen." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const room_id = String(formData.get("room_id") ?? "") || null;
  const trainer_id = String(formData.get("trainer_id") ?? "") || null;
  const max_participants = Number(formData.get("max_participants") ?? 20);
  const status = (String(formData.get("status") ?? "regulaer") ||
    "regulaer") as CourseStatus;
  const weekdays_raw = String(formData.get("series_weekdays") ?? "");
  const interval_weeks = Math.max(1, Number(formData.get("series_interval") ?? 1));
  const series_start = String(formData.get("series_start") ?? "");
  const series_end = String(formData.get("series_end") ?? "");

  if (!name || !start_time || !end_time)
    return { error: "Bitte fülle alle Pflichtfelder aus." };
  if (end_time <= start_time)
    return { error: "Die Endzeit muss nach der Startzeit liegen." };
  if (!weekdays_raw)
    return { error: "Bitte wähle mindestens einen Wochentag aus." };
  if (!series_start || !series_end)
    return { error: "Bitte Zeitraum angeben." };
  if (series_end < series_start)
    return { error: "Das Enddatum darf nicht vor dem Startdatum liegen." };

  const today = new Date().toISOString().slice(0, 10);
  const maxEnd = seriesHorizonEndISO();
  if (series_start < today)
    return { error: "Das Startdatum darf nicht in der Vergangenheit liegen." };
  if (profile.role !== "admin" && series_end > maxEnd)
    return { error: "Kurse können maximal 4 Wochen im Voraus geplant werden." };

  const dowIndices = weekdays_raw
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
  if (!dowIndices.length)
    return { error: "Keine gültigen Wochentage gewählt." };

  const dates = generateSeriesDates(series_start, series_end, dowIndices, interval_weeks);
  if (!dates.length)
    return { error: "Im gewählten Zeitraum liegen keine passenden Termine." };

  const supabase = await createClient();

  // Capacity: check once (same room for all dates)
  if (room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("capacity")
      .eq("id", room_id)
      .maybeSingle();
    if (room && max_participants > room.capacity)
      return {
        error: `Die Teilnehmerzahl überschreitet die Raumkapazität (${room.capacity} Plätze).`,
      };
  }

  // Fetch all existing courses in the range once for in-memory conflict check
  const { data: existing } = await supabase
    .from("courses")
    .select("date, start_time, end_time, room_id, trainer_id")
    .gte("date", series_start)
    .lte("date", series_end)
    .neq("status", "abgesagt");

  // Standort des neuen Serienkurses ermitteln
  let seriesLocationId: string | null = null;
  if (room_id) {
    const { data: seriesRoom } = await supabase
      .from("rooms")
      .select("location_id")
      .eq("id", room_id)
      .maybeSingle();
    seriesLocationId = seriesRoom?.location_id ?? null;
  }

  // Standorte aller vorhandenen Kursräume vorab laden
  const allExistingRoomIds = [
    ...new Set(
      (existing ?? []).map((e) => e.room_id).filter((id): id is string => id !== null),
    ),
  ];
  const seriesRoomLocationMap: Record<string, string> = {};
  if (allExistingRoomIds.length > 0) {
    const { data: allRooms } = await supabase
      .from("rooms")
      .select("id, location_id")
      .in("id", allExistingRoomIds);
    if (allRooms) for (const r of allRooms) seriesRoomLocationMap[r.id] = r.location_id;
  }

  type ExistingSlot = {
    date: string;
    start_time: string;
    end_time: string;
    room_id: string | null;
    trainer_id: string | null;
    location_id: string | null;
  };

  const existingList: ExistingSlot[] = (existing ?? []).map((e) => ({
    ...e,
    location_id: e.room_id ? (seriesRoomLocationMap[e.room_id] ?? null) : null,
  }));

  const series_id = crypto.randomUUID();
  type SeriesRow = {
    name: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    room_id: string | null;
    trainer_id: string | null;
    max_participants: number;
    status: CourseStatus;
    series_id: string;
  };
  const toInsert: SeriesRow[] = [];
  const skipped: { date: string; reason: string }[] = [];

  for (const date of dates) {
    const daySlots = existingList.filter((e) => e.date === date);

    if (room_id && status !== "abgesagt") {
      const roomClash = daySlots.some(
        (e) =>
          e.room_id === room_id &&
          e.start_time < end_time &&
          e.end_time > start_time,
      );
      if (roomClash) {
        skipped.push({ date, reason: "Raum belegt" });
        continue;
      }
    }

    if (trainer_id && status !== "abgesagt") {
      const newS = timeToMinutes(start_time);
      const newE = timeToMinutes(end_time);
      const trainerClash = daySlots.some((e) => {
        if (e.trainer_id !== trainer_id) return false;
        const es = timeToMinutes(e.start_time);
        const ee = timeToMinutes(e.end_time);
        const sameLocation =
          seriesLocationId !== null && e.location_id !== null && seriesLocationId === e.location_id;
        return sameLocation ? newS < ee && es < newE : newS < ee + 60 && es < newE + 60;
      });
      if (trainerClash) {
        skipped.push({ date, reason: "Trainer belegt (Überschneidung oder zu wenig Pause)" });
        continue;
      }
    }

    toInsert.push({
      name,
      description,
      date,
      start_time,
      end_time,
      room_id,
      trainer_id,
      max_participants,
      status,
      series_id,
    });
    // Shadow into existingList so later same-day series entries see themselves
    existingList.push({ date, start_time, end_time, room_id, trainer_id, location_id: seriesLocationId });
  }

  if (!toInsert.length)
    return {
      error:
        "Alle Termine haben Konflikte — keine Kurse wurden angelegt.",
      skipped,
    };

  const { error: insertError } = await supabase.from("courses").insert(toInsert);
  if (insertError) {
    const known = /belegt|Kapazität|ausgebucht/.test(insertError.message ?? "");
    return {
      error: known
        ? insertError.message
        : "Kurse konnten nicht gespeichert werden.",
    };
  }

  revalidateCourses();
  return {
    message: `${toInsert.length} Kurs${toInsert.length === 1 ? "" : "e"} angelegt.`,
    created: toInsert.length,
    skipped: skipped.length ? skipped : undefined,
  };
}

// ---------- Kurs bearbeiten / löschen / archivieren (verwalten) ----------
function revalidateCourses() {
  revalidatePath("/portal/verwaltung");
  revalidatePath("/portal/kurse");
  revalidatePath("/portal/stundenplan");
  revalidatePath("/portal/dashboard");
}

export async function updateCourseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getProfile();
  if (!profile) return { error: "Nicht angemeldet." };
  if (!canManageCourses(profile))
    return { error: "Keine Berechtigung, Kurse zu verwalten." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Kurs nicht gefunden." };

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

  const supabase = await createClient();

  // Same room rules as on create, but excluding the course being edited.
  if (room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("capacity")
      .eq("id", room_id)
      .maybeSingle();
    if (room && max_participants > room.capacity)
      return {
        error: `Die Teilnehmerzahl überschreitet die Raumkapazität (${room.capacity} Plätze).`,
      };

    if (status !== "abgesagt") {
      const { data: clash } = await supabase
        .from("courses")
        .select("id")
        .eq("room_id", room_id)
        .eq("date", date)
        .neq("id", id)
        .neq("status", "abgesagt")
        .lt("start_time", end_time)
        .gt("end_time", start_time)
        .limit(1);
      if (clash && clash.length > 0)
        return { error: "Raum ist zu dieser Zeit bereits belegt." };
    }
  }

  // Trainer-Konfliktprüfung (eigenen Kurs ausschließen): gleiches Studio → kein Puffer; anderes → 60 Min.
  if (trainer_id && status !== "abgesagt") {
    let newLocationId: string | null = null;
    if (room_id) {
      const { data: newRoom } = await supabase
        .from("rooms")
        .select("location_id")
        .eq("id", room_id)
        .maybeSingle();
      newLocationId = newRoom?.location_id ?? null;
    }

    const { data: trainerCourses } = await supabase
      .from("courses")
      .select("start_time, end_time, room_id")
      .eq("trainer_id", trainer_id)
      .eq("date", date)
      .neq("id", id)
      .neq("status", "abgesagt");

    if (trainerCourses && trainerCourses.length > 0) {
      const roomIds = [
        ...new Set(trainerCourses.map((c) => c.room_id).filter((id): id is string => id !== null)),
      ];
      const roomLocationMap: Record<string, string> = {};
      if (roomIds.length > 0) {
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, location_id")
          .in("id", roomIds);
        if (rooms) for (const r of rooms) roomLocationMap[r.id] = r.location_id;
      }

      const newS = timeToMinutes(start_time);
      const newE = timeToMinutes(end_time);

      for (const c of trainerCourses) {
        const es = timeToMinutes(c.start_time);
        const ee = timeToMinutes(c.end_time);
        const existingLocId = c.room_id ? (roomLocationMap[c.room_id] ?? null) : null;
        const sameLocation =
          newLocationId !== null && existingLocId !== null && newLocationId === existingLocId;

        if (sameLocation) {
          if (newS < ee && es < newE)
            return { error: "Dieser Trainer ist zu dieser Zeit bereits belegt." };
        } else {
          if (newS < ee + 60 && es < newE + 60)
            return {
              error:
                "Dieser Trainer benötigt mindestens 60 Minuten Pause zwischen Kursen in verschiedenen Studios.",
            };
        }
      }
    }
  }

  const { error } = await supabase
    .from("courses")
    .update({
      name,
      description,
      date,
      start_time,
      end_time,
      room_id,
      trainer_id,
      max_participants: Number.isFinite(max_participants) ? max_participants : 20,
      status,
    })
    .eq("id", id);
  if (error) {
    const known = /belegt|Raumkapazität|ausgebucht|abgesagt/.test(
      error.message ?? "",
    );
    return {
      error: known ? error.message : "Kurs konnte nicht gespeichert werden.",
    };
  }

  revalidateCourses();
  return { message: `Kurs „${name}“ wurde aktualisiert.` };
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile || !canManageCourses(profile)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", id);
  revalidateCourses();
}

export async function deleteCoursesAction(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile || !canManageCourses(profile)) return;
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) return;
  const supabase = await createClient();
  await supabase.from("courses").delete().in("id", ids);
  revalidateCourses();
}

export async function setCourseArchivedAction(
  formData: FormData,
): Promise<void> {
  const profile = await getProfile();
  if (!profile || !canManageCourses(profile)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const archived = String(formData.get("archived") ?? "") === "true";
  const supabase = await createClient();
  await supabase.from("courses").update({ archived }).eq("id", id);
  revalidateCourses();
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
