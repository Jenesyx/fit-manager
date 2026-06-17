import Link from "next/link";
import { Plus } from "lucide-react";
import { requireProfile, canManageCourses } from "@/lib/auth";
import { getCoursesInHorizon, type EnrichedCourse } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/portal/ui";
import { ExpandableCourseCard } from "@/components/portal/expandable-course-card";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { formatDayLong } from "@/lib/dates";

export default async function KursePage() {
  const profile = await requireProfile();
  const manage = canManageCourses(profile);
  const courses = await getCoursesInHorizon();

  // Kunde: which courses are they registered for?
  let registered = new Set<string>();
  if (profile.role === "kunde") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("course_registrations")
      .select("course_id")
      .eq("kunde_id", profile.id);
    registered = new Set((data ?? []).map((r) => r.course_id));
  }

  // group by date
  const byDay = new Map<string, EnrichedCourse[]>();
  for (const c of courses) {
    if (!byDay.has(c.date)) byDay.set(c.date, []);
    byDay.get(c.date)!.push(c);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nächste 2 Wochen"
        title="Kurse"
        subtitle="Alle geplanten Kurse im aktuellen Zwei-Wochen-Zeitraum."
        action={
          manage ? (
            <Button asChild>
              <Link href="/portal/kurse/erstellen">
                <Plus className="size-4" />
                Kurs erstellen
              </Link>
            </Button>
          ) : undefined
        }
      />

      {byDay.size === 0 ? (
        <EmptyState
          title="Keine Kurse geplant"
          description="Für die nächsten zwei Wochen sind aktuell keine Kurse eingetragen."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {[...byDay.entries()].map(([date, list]) => (
            <section key={date}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {formatDayLong(date)}
              </h2>
              <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((c) => (
                  <RevealItem key={c.id}>
                    <ExpandableCourseCard
                      course={c}
                      isRegistered={registered.has(c.id)}
                      role={profile.role}
                    />
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
