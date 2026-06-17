import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/app/(auth)/actions";

export default function RegistrierenPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Konto erstellen</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-strong">
          Bei Fit-Manager registrieren
        </h1>
        <p className="text-sm text-muted-foreground">
          Erstelle dein Konto mit deiner E-Mail-Adresse. Neue Konten starten als
          Kunde und können den Kursplan ansehen.
        </p>
      </div>

      <AuthForm
        action={signUpAction}
        submitLabel="Konto erstellen"
        fields={[
          {
            name: "full_name",
            label: "Vollständiger Name",
            placeholder: "Max Mustermann",
            autoComplete: "name",
          },
          {
            name: "email",
            label: "E-Mail",
            type: "email",
            placeholder: "name@beispiel.de",
            autoComplete: "email",
          },
          {
            name: "password",
            label: "Passwort",
            type: "password",
            placeholder: "Mindestens 6 Zeichen",
            autoComplete: "new-password",
          },
        ]}
      />

      <p className="text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link href="/anmelden" className="text-primary hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
