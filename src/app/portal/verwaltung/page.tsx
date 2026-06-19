import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getAllCoursesAdmin,
  getRegistrationCounts,
  getRoomsByLocation,
  getTrainers,
} from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { KursVerwaltung } from "@/components/portal/kurs-verwaltung";
import { Button } from "@/components/ui/button";

export default async function KursVerwaltungPage() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/portal/dashboard");

  const [courses, roomGroups, trainers] = await Promise.all([
    getAllCoursesAdmin(),
    getRoomsByLocation(),
    getTrainers(),
  ]);
  const fill = await getRegistrationCounts(courses.map((c) => c.id));

  const locations = roomGroups.map((g) => ({
    id: g.location.id,
    name: g.location.name,
    rooms: g.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
    })),
  }));

  const rows = courses.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    date: c.date,
    start_time: c.start_time,
    end_time: c.end_time,
    room_id: c.room_id,
    room_name: c.room_name,
    location_name: c.location_name,
    trainer_id: c.trainer_id,
    trainer_name: c.trainer_name,
    substitute_name: c.substitute_name,
    max_participants: c.max_participants,
    status: c.status,
    archived: c.archived,
    registered: fill.get(c.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Kursverwaltung"
        subtitle="Alle Kurse einsehen und verwalten — bearbeiten, Trainer & Raum ändern, archivieren oder löschen. Neue Trainer-Rechte unter Trainerverwaltung."
        action={
          <Button asChild>
            <Link href="/portal/kurse/erstellen">
              <Plus className="size-4" />
              Kurs erstellen
            </Link>
          </Button>
        }
      />
      <KursVerwaltung
        courses={rows}
        locations={locations}
        trainers={trainers.map((t) => ({ id: t.id, full_name: t.full_name }))}
      />
    </div>
  );
}
