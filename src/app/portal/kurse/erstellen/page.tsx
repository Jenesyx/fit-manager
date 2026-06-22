import { canManageCourses, requireProfile } from "@/lib/auth";
import { getRoomsByLocation, getTrainers, getCoursesInHorizon } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { KursErstellenForm } from "@/components/portal/kurs-erstellen-form";
import { todayISO, horizonEndISO } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function KursErstellenPage() {
  const profile = await requireProfile();
  if (!canManageCourses(profile)) redirect("/portal/dashboard");

  const [roomGroups, trainers, courses] = await Promise.all([
    getRoomsByLocation(),
    getTrainers(),
    getCoursesInHorizon(),
  ]);

  const locations = roomGroups.map((g) => ({
    id: g.location.id,
    name: g.location.name,
    rooms: g.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
    })),
  }));

  const existing = courses.map((c) => ({
    id: c.id,
    date: c.date,
    start_time: c.start_time,
    end_time: c.end_time,
    room_id: c.room_id,
    trainer_id: c.trainer_id,
    status: c.status,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Planung"
        title="Kurs erstellen"
        subtitle="Lege einen neuen Kurs an. Die Vorschau und der Konflikt-Check aktualisieren sich live."
      />
      <KursErstellenForm
        locations={locations}
        trainers={trainers.map((t) => ({ id: t.id, full_name: t.full_name }))}
        existing={existing}
        minDate={todayISO()}
        maxDate={profile.role === "admin" ? undefined : horizonEndISO()}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
