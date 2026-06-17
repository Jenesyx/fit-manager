import Link from "next/link";
import {
  HeartPulse,
  Search,
  CheckCheck,
  CalendarRange,
  ShieldCheck,
  UserCog,
  Eye,
  ArrowRight,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      {/* ── Fixed scroll-scrubbed video hero + 500 vh spacer ────────────── */}
      <Hero />

      {/*
       * ── Content layer ─────────────────────────────────────────────────
       * z-10 + solid bg-background means this div slides UP over the fixed
       * video as the user scrolls past the 500 vh spacer — pure CSS parallax,
       * no JS required.  The rounded top + shadow give the "card lifting over"
       * depth effect.
       */}
      <div
        className="relative z-10 bg-background"
        style={{
          borderRadius: "2rem 2rem 0 0",
          boxShadow: "0 -40px 80px rgba(0,0,0,0.75)",
        }}
      >
        {/* Nav is sticky inside this div — hidden while hero plays,
            sticks to viewport top once content enters the screen. */}
        <MarketingNav />

        <main>
          {/* ---------- Automatische Vertretung -------------------------------- */}
          <section id="funktionen" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <span className="eyebrow">Der Hauptprozess</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  Vom Ausfall zur Vertretung. Ohne manuelles Eingreifen.
                </h2>
                <p className="mt-4 text-lg text-body">
                  Trainer melden sich krank, das System übernimmt den Rest und
                  hält den Stundenplan aktuell.
                </p>
              </Reveal>

              <RevealGroup className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    icon: HeartPulse,
                    title: "Krankmeldung erfassen",
                    body: "Trainer trägt Start- und Enddatum ein. Betroffene Kurse werden sofort erkannt.",
                  },
                  {
                    icon: Search,
                    title: "Vertretung suchen",
                    body: "Das System prüft automatisch, welche Trainer zur passenden Zeit frei sind.",
                  },
                  {
                    icon: CheckCheck,
                    title: "Ergebnis eintragen",
                    body: "Freier Trainer wird als Vertretung gesetzt. Ist keiner frei, wird der Kurs abgesagt.",
                  },
                ].map((step, i) => (
                  <RevealItem key={step.title}>
                    <div className="card-hairline relative h-full p-6">
                      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                        <step.icon className="size-5 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-ink-strong">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-body">
                        {step.body}
                      </p>
                      {i < 2 ? (
                        <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-hairline md:block" />
                      ) : null}
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- Rollen (bento) ----------------------------------------- */}
          <section id="rollen" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  Drei Rollen, ein System.
                </h2>
                <p className="mt-4 text-lg text-body">
                  Jede Person sieht genau das, was sie braucht.
                </p>
              </Reveal>

              <div className="grid gap-4 md:grid-cols-3">
                <Reveal className="md:col-span-2">
                  <div className="card-hairline relative h-full overflow-hidden border-primary/40 p-7">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-primary/10 blur-3xl"
                    />
                    <div className="mb-4 flex size-11 items-center justify-center rounded-md border border-primary/40 bg-primary/15">
                      <ShieldCheck className="size-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-ink-strong">Admin</h3>
                    <p className="mt-2 max-w-md text-body">
                      Der Studio-Chef verwaltet Kurse und Trainer, vergibt Rechte
                      und sieht alle wichtigen Kennzahlen auf einen Blick.
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-2 text-sm">
                      {[
                        "Kurse verwalten",
                        "Trainer verwalten",
                        "Rechte vergeben",
                        "Alle Daten",
                      ].map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-hairline px-3 py-1 text-body"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                <Reveal delay={0.1}>
                  <div className="card-hairline flex h-full flex-col p-7">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-md border border-hairline bg-(--color-canvas-soft)">
                      <UserCog className="size-6 text-body" />
                    </div>
                    <h3 className="text-2xl font-semibold text-ink-strong">Trainer</h3>
                    <p className="mt-2 text-body">
                      Sieht den eigenen Stundenplan und erfasst Krankmeldungen. Mit
                      Berechtigung auch Kurse erstellen.
                    </p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="card-hairline flex h-full flex-col p-7">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-md border border-hairline bg-(--color-canvas-soft)">
                      <Eye className="size-6 text-body" />
                    </div>
                    <h3 className="text-2xl font-semibold text-ink-strong">Kunde</h3>
                    <p className="mt-2 text-body">
                      Behält den Kursplan im Blick und meldet sich für Kurse an.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={0.1} className="md:col-span-2">
                  <div className="card-hairline flex h-full flex-col justify-center p-7">
                    <div className="mb-3 flex size-11 items-center justify-center rounded-md border border-hairline bg-(--color-canvas-soft)">
                      <CalendarRange className="size-6 text-body" />
                    </div>
                    <h3 className="text-xl font-semibold text-ink-strong">
                      Immer zwei Wochen im Voraus
                    </h3>
                    <p className="mt-2 max-w-lg text-body">
                      Der Stundenplan zeigt genau das aktuelle Zwei-Wochen-Fenster.
                      Reguläre, vertretene und abgesagte Kurse klar gekennzeichnet.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------- Ablauf -------------------------------------------------- */}
          <section id="ablauf" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  In drei Schritten startklar.
                </h2>
              </Reveal>
              <RevealGroup className="grid gap-px overflow-hidden rounded-lg border border-hairline md:grid-cols-3">
                {[
                  {
                    n: "01",
                    title: "Konto erstellen",
                    body: "Mit deiner E-Mail registrieren. Neue Konten starten als Kunde.",
                  },
                  {
                    n: "02",
                    title: "Rolle erhalten",
                    body: "Der Admin macht dich zum Trainer oder Admin und vergibt Kursrechte.",
                  },
                  {
                    n: "03",
                    title: "Loslegen",
                    body: "Kurse planen, Stundenplan einsehen, Krankmeldungen erfassen.",
                  },
                ].map((s) => (
                  <RevealItem key={s.n}>
                    <div className="h-full bg-card p-7">
                      <span className="font-numeric text-3xl font-medium text-primary">
                        {s.n}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold text-ink-strong">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-sm text-body">{s.body}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- CTA ----------------------------------------------------- */}
          <section className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-24">
              <Reveal>
                <div className="card-hairline glow-primary relative overflow-hidden border-primary/40 px-8 py-16 text-center">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 size-105 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
                  />
                  <h2 className="relative text-3xl font-semibold tracking-tight text-ink-strong md:text-5xl">
                    Bereit für weniger Chaos im Studio?
                  </h2>
                  <p className="relative mx-auto mt-4 max-w-md text-lg text-body">
                    Starte mit Fit-Manager und überlasse die Vertretungssuche dem
                    System.
                  </p>
                  <div className="relative mt-8 flex justify-center">
                    <Button asChild size="lg" className="font-semibold">
                      <Link href="/registrieren">
                        Jetzt starten
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        {/* ---------- Footer -------------------------------------------------- */}
        <footer className="border-t border-hairline/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
            <Wordmark />
            <p className="font-numeric text-xs uppercase tracking-widest text-muted-foreground">
              Fit &amp; Aktiv · Berlin
            </p>
            <div className="flex items-center gap-6 text-sm text-body">
              <Link href="/anmelden" className="hover:text-primary">
                Anmelden
              </Link>
              <Link href="/registrieren" className="hover:text-primary">
                Registrieren
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
