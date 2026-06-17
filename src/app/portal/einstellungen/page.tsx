import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/portal/ui";
import { EinstellungenForm } from "@/components/portal/einstellungen-form";
import { ROLE_LABEL } from "@/lib/constants";

export default async function EinstellungenPage() {
  const profile = await requireProfile();

  return (
    <div>
      <PageHeader
        eyebrow="Konto"
        title="Einstellungen"
        subtitle="Verwalte deine Kontodaten."
      />

      <div className="mb-8 grid max-w-md gap-3 text-sm">
        <div className="flex items-center justify-between rounded-md border border-hairline px-4 py-3">
          <span className="text-muted-foreground">E-Mail</span>
          <span className="text-body">{profile.email ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-hairline px-4 py-3">
          <span className="text-muted-foreground">Rolle</span>
          <span className="text-body">{ROLE_LABEL[profile.role]}</span>
        </div>
      </div>

      <EinstellungenForm fullName={profile.full_name} />
    </div>
  );
}
