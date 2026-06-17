import { requireProfile } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { PageHeader, Kpi, EmptyState } from "@/components/portal/ui";
import { CourseCard } from "@/components/portal/course-card";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { formatDayLong } from "@/lib/dates";
import { todayISO } from "@/lib/dates";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const { stats, todayCourses } = await getDashboardData();
  const isAdmin = profile.role === "admin";

  return (
    <div>
      <PageHeader
        eyebrow={formatDayLong(todayISO())}
        title="Dashboard"
        subtitle="Überblick über den heutigen Betrieb und den Systemstatus der automatischen Vertretung."
      />

      <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <RevealItem>
          <Kpi label="Kurse heute" value={stats.coursesToday} />
        </RevealItem>
        <RevealItem>
          <Kpi label="Krankmeldungen aktuell" value={stats.activeSickLeaves} />
        </RevealItem>
        <RevealItem>
          <Kpi
            label="Auto-Vertretungen"
            value={stats.autoSubstitutions}
            accent
            hint="nächste 2 Wochen"
          />
        </RevealItem>
        <RevealItem>
          <Kpi
            label="Abgesagte Kurse"
            value={stats.cancelled}
            hint="nächste 2 Wochen"
          />
        </RevealItem>
      </RevealGroup>

      {isAdmin ? (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Anzahl Trainer" value={stats.trainerCount} />
          <Kpi label="Kurse · 2 Wochen" value={stats.coursesNext2Weeks} />
          <Kpi label="Krankmeldungen" value={stats.activeSickLeaves} />
          <Kpi label="Abgesagt · 2 Wochen" value={stats.cancelled} />
        </div>
      ) : null}

      {/* System status hint */}
      <div className="mt-6 flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
        <p className="text-body">
          <span className="font-medium text-ink-strong">Systemstatus:</span> Die
          automatische Vertretungssuche ist aktiv. Bei Krankmeldungen werden freie
          Trainer automatisch eingetragen, sonst wird der Kurs abgesagt.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-ink-strong">
          Heutige Kurse
        </h2>
        {todayCourses.length ? (
          <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todayCourses.map((c) => (
              <RevealItem key={c.id}>
                <CourseCard course={c} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState
            title="Heute keine Kurse"
            description="Für heute sind keine Kurse geplant. Plane Kurse im Bereich „Kurs erstellen“."
          />
        )}
      </section>
    </div>
  );
}
