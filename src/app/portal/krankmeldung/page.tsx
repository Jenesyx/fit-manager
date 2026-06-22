import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getCoursesInHorizon, getMySickLeaves } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { KrankmeldungForm } from "@/components/portal/krankmeldung-form";
import { todayISO, horizonEndISO, formatDayLong } from "@/lib/dates";

export default async function KrankmeldungPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && profile.role !== "admin") {
    redirect("/portal/dashboard");
  }

  const [courses, sickLeaves] = await Promise.all([
    getCoursesInHorizon(),
    getMySickLeaves(),
  ]);

  const myCourses = courses
    .filter((c) => c.trainer_id === profile.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      date: c.date,
      start_time: c.start_time,
      end_time: c.end_time,
      status: c.status,
    }));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeader
          eyebrow="Hauptprozess"
          title="Krankmeldung erfassen"
          subtitle="Melde dich krank, das System sucht automatisch nach Vertretungen für deine Kurse."
        />
        <KrankmeldungForm
          minDate={todayISO()}
          maxDate={horizonEndISO()}
          myCourses={myCourses}
        />
      </div>

      {/* Own sick leave history */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-strong">
          Meine Krankmeldungen
        </h2>
        {sickLeaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Krankmeldungen erfasst.
          </p>
        ) : (
          <div className="card-hairline overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Von</th>
                  <th className="px-4 py-3 font-medium">Bis</th>
                  <th className="px-4 py-3 font-medium">Grund</th>
                  <th className="px-4 py-3 font-medium">Erfasst am</th>
                </tr>
              </thead>
              <tbody>
                {sickLeaves.map((sl) => (
                  <tr
                    key={sl.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-ink-strong">
                      {formatDayLong(sl.start_date)}
                    </td>
                    <td className="px-4 py-3 text-ink-strong">
                      {formatDayLong(sl.end_date)}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {sl.reason ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDayLong(sl.created_at.slice(0, 10))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
