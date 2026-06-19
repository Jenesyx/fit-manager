import Link from "next/link";
import { Home, Dumbbell } from "lucide-react";

export const metadata = {
  title: "404 · Seite nicht gefunden — Fit & Aktiv",
};

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
      <Dumbbell className="mb-6 size-12 text-primary opacity-80" />

      <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-strong">
        Seite nicht gefunden
      </h1>
      <p className="mt-4 max-w-sm text-base text-muted-foreground">
        Diese Seite existiert nicht oder wurde verschoben. Vielleicht hilft dir
        ein Blick auf unsere Kurse.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Home className="size-4" />
          Startseite
        </Link>
        <Link
          href="/portal/kurse"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Zum Kursplan
        </Link>
      </div>
    </main>
  );
}
