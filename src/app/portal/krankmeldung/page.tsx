import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getCoursesInHorizon } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { KrankmeldungForm } from "@/components/portal/krankmeldung-form";
import { todayISO, horizonEndISO } from "@/lib/dates";

export default async function KrankmeldungPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && profile.role !== "admin") {
    redirect("/portal/dashboard");
  }

  const courses = await getCoursesInHorizon();
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
  );
}
