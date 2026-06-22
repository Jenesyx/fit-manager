import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/(auth)/actions";

export default async function AnmeldenPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string }>;
}) {
  const { weiter } = await searchParams;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Portal</span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-strong">
          Willkommen zurück
        </h1>
        <p className="text-sm text-muted-foreground">
          Melde dich an, um auf dein Fit Manager Konto zuzugreifen.
        </p>
      </div>

      <AuthForm
        action={signInAction}
        submitLabel="Anmelden"
        hiddenWeiter={weiter}
        fields={[
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
            placeholder: "••••••••",
            autoComplete: "current-password",
          },
        ]}
      />

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <Link href="/passwort-vergessen" className="hover:text-primary">
          Passwort vergessen?
        </Link>
        <p>
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="text-primary hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
