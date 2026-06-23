import Link from "next/link";
import {
  Dumbbell,
  Flame,
  Bike,
  Leaf,
  Waves,
  Activity,
  Zap,
  HeartPulse,
  Users,
  MapPin,
  Clock,
  BadgeCheck,
  Trophy,
  CalendarCheck,
  Quote,
  Star,
  ArrowRight,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "1.200+", label: "Mitglieder" },
  { value: "10", label: "Studios" },
  { value: "5", label: "Städte" },
  { value: "40+", label: "Kurse pro Woche" },
];

const COURSES = [
  {
    icon: Dumbbell,
    title: "Krafttraining",
    body: "Freihantel- und Gerätebereich auf über 600 m², vom Einstieg bis zum Maximalkraft-Aufbau.",
  },
  {
    icon: Flame,
    title: "HIIT & Functional",
    body: "Intensive 45-Minuten-Einheiten, die Ausdauer und Kraft gleichzeitig pushen.",
  },
  {
    icon: Bike,
    title: "Indoor Cycling",
    body: "Beat-getriebene Rides im Cycling-Studio mit Live-Watt-Tracking.",
  },
  {
    icon: Leaf,
    title: "Yoga & Mobility",
    body: "Beweglichkeit, Atem und Regeneration, für Kopf und Körper.",
  },
  {
    icon: Waves,
    title: "Pilates & Core",
    body: "Tiefe Rumpfmuskulatur, stabile Haltung, weniger Rückenschmerzen.",
  },
  {
    icon: Activity,
    title: "Bodypump",
    body: "Langhantel-Workout für den ganzen Körper, perfekt getaktet auf Musik.",
  },
  {
    icon: Zap,
    title: "Boxen & Cardio",
    body: "Technik am Sack, Conditioning im Ring. Auspowern garantiert.",
  },
  {
    icon: HeartPulse,
    title: "Reha & Rücken",
    body: "Betreutes Training nach Verletzungen und gegen Büro-Verspannungen.",
  },
];

const LOCATIONS = [
  { city: "Mönchengladbach", studios: "2 Studios", note: "Zentrum · Rheydt" },
  { city: "Köln", studios: "2 Studios", note: "Innenstadt · Ehrenfeld" },
  { city: "Düsseldorf", studios: "2 Studios", note: "Altstadt · Bilk" },
  { city: "Duisburg", studios: "2 Studios", note: "Mitte · Hamborn" },
  { city: "Krefeld", studios: "2 Studios", note: "Zentrum · Uerdingen" },
];

const BENEFITS = [
  {
    icon: CalendarCheck,
    title: "Alle Kurse inklusive",
    body: "Über 40 Kurse pro Woche, ohne Aufpreis, einfach reinkommen und mitmachen.",
  },
  {
    icon: Clock,
    title: "Täglich 6–23 Uhr",
    body: "Früh vor der Arbeit oder spät am Abend, du trainierst, wann es dir passt.",
  },
  {
    icon: BadgeCheck,
    title: "25 zertifizierte Trainer",
    body: "Echte Ansprechpartner auf der Fläche, die deinen Plan mit dir bauen.",
  },
  {
    icon: MapPin,
    title: "In jedem Studio trainieren",
    body: "Eine Mitgliedschaft, alle 10 Standorte, auch unterwegs in deiner Stadt.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "In sechs Monaten 14 Kilo runter und endlich Spaß am Training. Die Kurse sind der Wahnsinn.",
    name: "Lena M.",
    meta: "Mitglied · Berlin-Mitte",
  },
  {
    quote:
      "Sauber, modern, nie überfüllt. Die Trainer kennen meinen Namen und meinen Plan.",
    name: "Tobias K.",
    meta: "Mitglied · Hamburg-Altona",
  },
  {
    quote:
      "Ich wechsle viel zwischen den Städten und trainiere überall mit derselben Karte. Perfekt.",
    name: "Aylin S.",
    meta: "Mitglied · München-Schwabing",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Cinematic scroll-triggered video hero (pinned while it plays) ──── */}
      <Hero />

      {/*
       * ── Content layer ─────────────────────────────────────────────────
       * z-20 + solid bg-background slides UP over the fixed video as the user
       * scrolls past the hero — pure CSS, no JS. The rounded top + shadow give
       * the "card lifting over the video" depth effect.
       */}
      <div
        className="relative z-20 bg-background"
        style={{
          borderRadius: "2rem 2rem 0 0",
          boxShadow: "0 -40px 80px rgba(0,0,0,0.75)",
        }}
      >
        <MarketingNav />

        <main>
          {/* ---------- Stats band -------------------------------------------- */}
          <section className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-14">
              <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline md:grid-cols-4">
                {STATS.map((s) => (
                  <RevealItem key={s.label}>
                    <div className="bg-card px-6 py-8 text-center">
                      <div className="font-numeric text-4xl font-semibold text-primary md:text-5xl">
                        {s.value}
                      </div>
                      <div className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- Kurse ------------------------------------------------- */}
          <section id="kurse" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <span className="eyebrow">Dein Training</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  Acht Trainingswelten unter einem Dach.
                </h2>
                <p className="mt-4 text-lg text-body">
                  Egal ob du Kraft aufbauen, abnehmen oder einfach abschalten
                  willst, bei uns findest du den Kurs, der dich begeistert.
                </p>
              </Reveal>

              <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {COURSES.map((c) => (
                  <RevealItem key={c.title}>
                    <div className="card-hairline h-full p-6 transition-colors hover:border-primary/40">
                      <div className="mb-4 flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                        <c.icon className="size-5 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-ink-strong">
                        {c.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-body">{c.body}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- Standorte --------------------------------------------- */}
          <section id="standorte" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <span className="eyebrow">Standorte</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  10 Studios in 5 Städten. Und es werden mehr.
                </h2>
                <p className="mt-4 text-lg text-body">
                  Eine Mitgliedschaft, ganz Deutschland. Trainiere dort, wo du
                  gerade bist.
                </p>
              </Reveal>

              <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LOCATIONS.map((l) => (
                  <RevealItem key={l.city}>
                    <div className="card-hairline flex h-full items-start justify-between gap-4 p-6 transition-colors hover:border-hairline/80">
                      <div>
                        <h3 className="text-xl font-semibold text-ink-strong">
                          {l.city}
                        </h3>
                        <p className="mt-1 text-sm text-body">{l.note}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {l.studios}
                      </span>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- Angebot / Warum --------------------------------------- */}
          <section id="angebot" className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <span className="eyebrow">Warum Fit·Manager</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  Mehr als ein Fitnessstudio.
                </h2>
                <p className="mt-4 text-lg text-body">
                  Über 1.200 Mitglieder vertrauen uns ihr Training an. Das
                  bekommst du dafür.
                </p>
              </Reveal>

              <div className="grid gap-4 md:grid-cols-2">
                {BENEFITS.map((b, i) => (
                  <Reveal key={b.title} delay={i * 0.05}>
                    <div className="card-hairline flex h-full items-start gap-4 p-7">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                        <b.icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ink-strong">
                          {b.title}
                        </h3>
                        <p className="mt-1.5 text-body">{b.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- Stimmen ----------------------------------------------- */}
          <section className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
              <Reveal className="mb-12 max-w-2xl">
                <span className="eyebrow">Stimmen</span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-strong md:text-4xl">
                  Das sagen unsere Mitglieder.
                </h2>
              </Reveal>

              <RevealGroup className="grid gap-4 md:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <RevealItem key={t.name}>
                    <figure className="card-hairline flex h-full flex-col p-7">
                      <Quote className="size-6 text-primary/70" />
                      <blockquote className="mt-4 flex-1 text-body">
                        „{t.quote}“
                      </blockquote>
                      <div className="mt-5 flex items-center gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="size-4 fill-current" />
                        ))}
                      </div>
                      <figcaption className="mt-3">
                        <span className="font-semibold text-ink-strong">
                          {t.name}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {t.meta}
                        </span>
                      </figcaption>
                    </figure>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </section>

          {/* ---------- CTA --------------------------------------------------- */}
          <section className="border-t border-hairline/60">
            <div className="mx-auto max-w-7xl px-6 py-24">
              <Reveal>
                <div className="card-hairline glow-primary relative overflow-hidden border-primary/40 px-8 py-16 text-center">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 size-105 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
                  />
                  <div className="relative mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-primary/40 bg-primary/15">
                    <Trophy className="size-6 text-primary" />
                  </div>
                  <h2 className="relative text-3xl font-semibold tracking-tight text-ink-strong md:text-5xl">
                    Dein erstes Training geht auf uns.
                  </h2>
                  <p className="relative mx-auto mt-4 max-w-md text-lg text-body">
                    Komm zum kostenlosen Probetraining in eines unserer 10 Studios
                    ganz ohne Vertragsbindung.
                  </p>
                  <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg" className="font-semibold">
                      <Link href="/registrieren">
                        Probetraining sichern
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="#standorte">Studio in deiner Nähe</Link>
                    </Button>
                  </div>
                  <p className="relative mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    Schon über 1.200 Mitglieder dabei
                  </p>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        {/* ---------- Footer ------------------------------------------------- */}
        <footer className="border-t border-hairline/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
            <Wordmark />
            <p className="font-numeric text-xs uppercase tracking-widest text-muted-foreground">
              Mönchengladbach · Köln · Düsseldorf · Duisburg · Krefeld
            </p>
            <div className="flex items-center gap-6 text-sm text-body">
              <Link href="/anmelden" className="hover:text-primary">
                Anmelden
              </Link>
              <Link href="/registrieren" className="hover:text-primary">
                Mitglied werden
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
