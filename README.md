# Fit-Manager

Deutschsprachige Plattform zur Kurs- und Trainerverwaltung für das Fitnessstudio **Fit & Aktiv**.
Marketing-Startseite + rollenbasiertes Portal (Kunde / Trainer / Admin) mit **automatischer Vertretungssuche**.

## Stack
- Next.js 16 (App Router, TypeScript) · Tailwind v4 · shadcn/ui
- Motion (Animationen) · Inter + JetBrains Mono
- Supabase (Auth + Postgres + RLS)
- Dark „Voltagent"-Brand: Canvas `#101010`, Akzent `#00d992`

## Lokale Entwicklung
```bash
npm install
cp .env.example .env.local   # Supabase-Werte eintragen
npm run dev
```

## Supabase einrichten
1. Projekt auf supabase.com anlegen (Passwort: siehe `password.txt`).
2. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` setzen.
3. Migrationen anwenden (Supabase CLI):
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push        # wendet supabase/migrations/* an
   # Seed (Standorte + Räume):
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
4. Ersten Admin befördern (nach Registrierung über die App):
   ```sql
   update public.profiles set role='admin', can_create_courses=true
   where email='deine@email.de';
   ```
5. Typen neu generieren (optional):
   ```bash
   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
   ```

## Rollen
- **Kunde** (Standard nach Registrierung): Kursplan ansehen, sich anmelden.
- **Trainer**: eigenen Stundenplan, Krankmeldung; Kurse erstellen nur mit Berechtigung.
- **Admin**: Kurse/Trainer verwalten, Rechte vergeben, alle Daten.

## Automatische Vertretung
Beim Speichern einer Krankmeldung läuft der Postgres-Trigger `handle_sick_leave`:
freier Trainer → Kurs `vertreten`, sonst `abgesagt` („keine Vertretung verfügbar").
Nur Kurse im Zwei-Wochen-Fenster. Logik-Test: `supabase/tests/substitution.test.sql`.

## Tests / Verifikation
```bash
npm run build        # Typecheck + Build
npm run lint
# SQL-Logik gegen lokales Postgres (Docker):
#   siehe supabase/tests/substitution.test.sql
```

## Struktur
- `src/app/(auth)/` – Anmelden / Registrieren / Passwort
- `src/app/portal/` – Dashboard, Kurse, Kurs erstellen, Stundenplan, Krankmeldung, Trainerverwaltung, Einstellungen
- `src/lib/` – Supabase-Clients, Auth-Helfer, Queries, Domain-Konstanten
- `supabase/` – Migrationen, Seed, RLS, Tests
- `design-reference/` – Original-Designvorgaben (Tokens + Spec)
