import { createClient } from "@/lib/supabase/server";
import { todayISO, horizonEndISO } from "@/lib/dates";
import type { Database, CourseStatus } from "@/lib/database.types";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];

export type EnrichedCourse = CourseRow & {
  room_name: string | null;
  location_name: string | null;
  trainer_name: string | null;
  substitute_name: string | null;
  original_name: string | null;
};

export type RoomWithLocation = RoomRow & { location_name: string };

/** Attach room / location / trainer names to raw course rows. */
async function enrichCourses(courses: CourseRow[]): Promise<EnrichedCourse[]> {
  if (!courses.length) return [];
  const supabase = await createClient();

  const roomIds = [
    ...new Set(courses.map((c) => c.room_id).filter(Boolean)),
  ] as string[];
  const profileIds = [
    ...new Set(
      courses
        .flatMap((c) => [
          c.trainer_id,
          c.substitute_trainer_id,
          c.original_trainer_id,
        ])
        .filter(Boolean),
    ),
  ] as string[];

  const [{ data: rooms }, { data: profiles }, { data: locations }] =
    await Promise.all([
      supabase.from("rooms").select("*").in("id", roomIds),
      // RPC (SECURITY DEFINER) — resolves trainer/substitute names for ALL
      // users. A plain profiles select is RLS-blocked to the caller's own row.
      supabase.rpc("get_profile_names", { p_ids: profileIds }),
      supabase.from("locations").select("*"),
    ]);

  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r]));
  const locMap = new Map(
    ((locations as LocationRow[]) ?? []).map((l) => [l.id, l]),
  );
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name as string]),
  );

  return courses.map((c) => {
    const room = c.room_id ? roomMap.get(c.room_id) : undefined;
    const loc = room?.location_id ? locMap.get(room.location_id) : undefined;
    return {
      ...c,
      room_name: room?.name ?? null,
      location_name: loc?.name ?? null,
      trainer_name: c.trainer_id ? (nameMap.get(c.trainer_id) ?? null) : null,
      substitute_name: c.substitute_trainer_id
        ? (nameMap.get(c.substitute_trainer_id) ?? null)
        : null,
      original_name: c.original_trainer_id
        ? (nameMap.get(c.original_trainer_id) ?? null)
        : null,
    };
  });
}

/** Active courses within the next-2-weeks horizon (archived excluded). */
export async function getCoursesInHorizon(): Promise<EnrichedCourse[]> {
  const supabase = await createClient();
  try {
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .eq("archived", false)
      .gte("date", todayISO())
      .lte("date", horizonEndISO())
      .order("date")
      .order("start_time");
    return await enrichCourses(courses ?? []);
  } catch {
    return [];
  }
}

/** Every course (any date, incl. archived) — for the Admin Kursverwaltung. */
export async function getAllCoursesAdmin(): Promise<EnrichedCourse[]> {
  const supabase = await createClient();
  try {
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .order("date", { ascending: false })
      .order("start_time");
    return await enrichCourses(courses ?? []);
  } catch {
    return [];
  }
}

/**
 * Total registrations per course, keyed by course id. Uses a SECURITY
 * DEFINER RPC so Kunden see real fill counts (RLS hides others' rows).
 */
export async function getRegistrationCounts(
  courseIds: string[],
): Promise<Map<string, number>> {
  if (!courseIds.length) return new Map();
  const supabase = await createClient();
  try {
    const { data } = await supabase.rpc("get_course_registration_counts", {
      p_ids: courseIds,
    });
    return new Map(
      (data ?? []).map((r) => [r.course_id, Number(r.registered)]),
    );
  } catch {
    return new Map();
  }
}

export type DashboardStats = {
  coursesToday: number;
  activeSickLeaves: number;
  autoSubstitutions: number;
  cancelled: number;
  trainerCount: number;
  coursesNext2Weeks: number;
};

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  todayCourses: EnrichedCourse[];
}> {
  const courses = await getCoursesInHorizon();
  const today = todayISO();
  const todayCourses = courses.filter((c) => c.date === today);

  let activeSickLeaves = 0;
  let trainerCount = 0;
  try {
    const supabase = await createClient();
    const [{ count: sickCount }, { count: trCount }] = await Promise.all([
      supabase
        .from("sick_leaves")
        .select("*", { count: "exact", head: true })
        .gte("end_date", today),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("role", ["trainer", "admin"]),
    ]);
    activeSickLeaves = sickCount ?? 0;
    trainerCount = trCount ?? 0;
  } catch {
    /* no DB yet */
  }

  const countStatus = (s: CourseStatus, list: EnrichedCourse[]) =>
    list.filter((c) => c.status === s).length;

  return {
    stats: {
      coursesToday: todayCourses.length,
      activeSickLeaves,
      autoSubstitutions: countStatus("vertreten", courses),
      cancelled: countStatus("abgesagt", courses),
      trainerCount,
      coursesNext2Weeks: courses.length,
    },
    todayCourses,
  };
}

/** Locations + their rooms, for the Kurs-erstellen room grid. */
export async function getRoomsByLocation(): Promise<
  { location: LocationRow; rooms: RoomRow[] }[]
> {
  const supabase = await createClient();
  try {
    const [{ data: locations }, { data: rooms }] = await Promise.all([
      supabase.from("locations").select("*").order("name"),
      supabase.from("rooms").select("*").order("name"),
    ]);
    return ((locations as LocationRow[]) ?? []).map((location) => ({
      location,
      rooms: ((rooms as RoomRow[]) ?? []).filter(
        (r) => r.location_id === location.id,
      ),
    }));
  } catch {
    return [];
  }
}

/** Trainers + admins, for the trainer dropdown / management. */
export async function getTrainers(): Promise<
  Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "full_name" | "role" | "can_create_courses"
  >[]
> {
  const supabase = await createClient();
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, can_create_courses")
      .in("role", ["trainer", "admin"])
      .order("full_name");
    return data ?? [];
  } catch {
    return [];
  }
}

/** All users, for admin trainer management. */
export async function getAllProfiles(): Promise<
  Database["public"]["Tables"]["profiles"]["Row"][]
> {
  const supabase = await createClient();
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}
