import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getAllProfiles } from "@/lib/queries";
import { PageHeader } from "@/components/portal/ui";
import { TrainerManager } from "@/components/portal/trainer-manager";

export default async function TrainerVerwaltungPage() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/portal/dashboard");

  const profiles = await getAllProfiles();

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Trainerverwaltung"
        subtitle="Weise Rollen zu und vergib Kursrechte. Neue Konten starten als Kunde."
      />
      <TrainerManager
        profiles={profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          role: p.role,
          can_create_courses: p.can_create_courses,
        }))}
        currentUserId={profile.id}
      />
    </div>
  );
}
