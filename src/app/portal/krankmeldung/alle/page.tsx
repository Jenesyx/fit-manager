import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAllSickLeavesAdmin } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { formatDayLong } from "@/lib/dates";

export default async function AlleKrankmeldungenPage() {
  await requireRole(["admin"]);

  const sickLeaves = await getAllSickLeavesAdmin();

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Alle Krankmeldungen"
        subtitle="Übersicht aller erfassten Krankmeldungen von Trainern."
      />

      {sickLeaves.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine Krankmeldungen vorhanden.
        </p>
      ) : (
        <div className="card-hairline overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Trainer</th>
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
                  <td className="px-4 py-3 font-medium text-ink-strong">
                    {sl.trainer_name ?? (
                      <span className="text-muted-foreground italic">
                        Gelöscht
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-strong">
                    {formatDayLong(sl.start_date)}
                  </td>
                  <td className="px-4 py-3 text-ink-strong">
                    {formatDayLong(sl.end_date)}
                  </td>
                  <td className="px-4 py-3 text-body">
                    {sl.reason ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
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
  );
}
