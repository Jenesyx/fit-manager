import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/app/(auth)/actions";

export default function PasswortVergessenPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Passwort</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-strong">
          Passwort zurücksetzen
        </h1>
        <p className="text-sm text-muted-foreground">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum
          Zurücksetzen.
        </p>
      </div>

      <AuthForm
        action={resetPasswordAction}
        submitLabel="Link senden"
        fields={[
          {
            name: "email",
            label: "E-Mail",
            type: "email",
            placeholder: "name@beispiel.de",
            autoComplete: "email",
          },
        ]}
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/anmelden" className="text-primary hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
