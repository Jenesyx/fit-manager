import { requireProfile } from "@/lib/auth";
import { getCoursesInHorizon } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import {
  StundenplanClient,
  type PlanCourse,
} from "@/components/portal/stundenplan-client";
import { weekStart, format, addDays, parseISO, horizonEndISO } from "@/lib/dates";

/** Monday week-starts that intersect the [today, horizonEnd] window. */
function allowedWeekStarts(): string[] {
  const firstMonday = weekStart(new Date());
  const end = parseISO(horizonEndISO());
  const result: string[] = [];
  let cursor = firstMonday;
  // include every week whose Monday is on or before the horizon end
  while (cursor <= end) {
    result.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 7);
  }
  return result.length ? result : [format(firstMonday, "yyyy-MM-dd")];
}

export default async function StundenplanPage() {
  await requireProfile();
  const courses = await getCoursesInHorizon();

  const planCourses: PlanCourse[] = courses.map((c) => ({
    id: c.id,
    name: c.name,
    date: c.date,
    start_time: c.start_time,
    end_time: c.end_time,
    status: c.status,
    room_name: c.room_name,
    location_name: c.location_name,
    trainer_name: c.trainer_name,
    original_name: c.original_name,
    substitute_name: c.substitute_name,
    cancel_reason: c.cancel_reason,
    max_participants: c.max_participants,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Kalender · nächste 2 Wochen"
        title="Stundenplan"
        subtitle="Wochenansicht aller Kurse. Vertretene Kurse zeigen den Wechsel, abgesagte Kurse den Grund."
      />
      <StundenplanClient courses={planCourses} weekStarts={allowedWeekStarts()} />
    </div>
  );
}
