# Fit-Manager — Design Spec (reconstructed from Claude Design chat transcripts)

> NOTE: The original Claude Design export URL returned the bundle once during planning
> (README, 3 chats, FitManager.html, colors_and_type.css were captured) but went 404
> before the screen `.jsx` files could be saved. This SPEC reconstructs the 4 screens
> from the chat transcripts + token CSS (`colors_and_type.css`). If pixel-perfect parity
> is needed, re-export a fresh design link to recover `dashboard.jsx`, `kurs-erstellen.jsx`,
> `stundenplan.jsx`, `screens.jsx`, `shared.jsx`, `design-canvas.jsx`.

App = **FitManager**, course & trainer management for fitness studio **"Fit & Aktiv"**.
No logo anywhere. Voltagent dark canvas, hairline borders, electric-green for **action/status only**,
Inter + JetBrains Mono. Mono used for numerics. German UI. Artboards 1440×920.

## System logic (3 roles)
- **Kunde** — view course plan only.
- **Trainer** — sees own Stundenplan, submits Krankmeldung. Can create courses only if authorized (`can_create_courses`).
- **Admin** (studio boss) — create/manage courses, manage trainers, grant admin rights, see all data.
- Courses are only shown/planned for the **next two weeks**.
- When a trainer is sick: system **automatically** finds a substitute. If a free trainer is found → entered as Vertretung. If none → course is automatically **Abgesagt** ("Grund: keine Vertretung verfügbar"). No manual takeover UI.

## Screen 1 — Dashboard
- Left sidebar nav: Dashboard (active), Meine Kurse, Stundenplan, Krankmeldung, Einstellungen. (+ Trainerverwaltung for Admin.)
- Top bar greeting (logged in as trainer "Ali Bidkhori": "Hallo, Ali").
- KPI cards (mono numerics): **Kurse heute**, **Krankmeldungen aktuell**, **Automatisch gefundene Vertretungen**, **Abgesagte Kurse**, plus a current Hinweise/Systemstatus area.
- Section "Heutige Kurse": course cards each showing **Status** (regulär / vertreten / abgesagt), **Trainername**, **Raum**, **Uhrzeit**. (Capacity bar styling from original.)
- Admin-only extra overview: Anzahl Trainer, Kurse in den nächsten 2 Wochen, Krankmeldungen, abgesagte Kurse.
- Removed old "Offene Anfragen" / manual substitution takeover (subs are now automatic).

## Screen 2 — Kurs erstellen
- Visible only to Admin + authorized Trainer.
- Form fields: **Kursname**, **Beschreibung**, **Datum**, **Startzeit**, **Endzeit oder Dauer**, **Standort** (branch: Mitte / Kreuzberg / Prenzlauer Berg / Charlottenburg), **Raum** (grid of rooms at the selected Standort; each chip shows capacity + `frei`/`belegt` pill; busy rooms dimmed/disabled; changing Standort updates rooms), **Trainer**, **Max. Teilnehmer** (stepper, default 20), **Status**.
- Hint: "Kurse können nur für die nächsten zwei Wochen geplant werden."
- Primary button **"Kurs anlegen"**, secondary **"Abbrechen"**.
- Right side **live preview** card: Kursname, Uhrzeit, Raum, Trainer, Teilnehmerlimit, Status.
- **Konflikt-Check** panel: Raum belegt? / Trainer zur Zeit frei? / Zeitraum innerhalb der nächsten zwei Wochen?

## Screen 3 — Stundenplan (MOST IMPORTANT)
- Weekly calendar grid. Header like "KW 21 · 19.–25. Mai 2026" with forward/back navigation. Only next two weeks navigable.
- Time range **07:00–20:00**. Today's column highlighted with a **now-line**.
- Course blocks with three clear statuses (color/label): **Regulär**, **Vertreten**, **Abgesagt**.
  - Vertreten block shows **original trainer → substitute trainer**.
  - Abgesagt block shows "Kurs abgesagt" + "Grund: keine Vertretung verfügbar".
- Hover **tooltip** on a block shows trainer + room + capacity.
- Block layout fix from chat: time on one line (nowrap) e.g. "14:00–15:00", status pill next to it, course name as title (truncate w/ ellipsis), footer line = room + participants. Row height ~64px so badge+title fit. No manual-takeover buttons.
- Example placed courses: Yoga Basics Mon 08:00, HIIT Advanced Wed 11:30, Pilates Core Fri 17:00; one Vertretung block (e.g. Spin Intervall Tue 14:00), one Abgesagt block (e.g. Functional Flow Thu 09:00).

## Screen 4 — Krankmeldung (main process)
- Title: **"Krankmeldung erfassen"**.
- Fields: **Startdatum**, **Enddatum**, optional **Grund**. Button: **"Krankmeldung speichern"**.
- Infobox: "Nach dem Speichern sucht das System automatisch nach Vertretungen. Wenn keine Vertretung verfügbar ist, wird der betroffene Kurs abgesagt."
- Area **"Betroffene Kurse"**.
- Area **"Ergebnis der automatischen Prüfung"** — after save shows: betroffene Kurse, gefundene Vertretungen, abgesagte Kurse, **Status pro Kurs**.

## Tokens (see colors_and_type.css)
Canvas #101010 / soft #1a1a1a; hairline #3d3a39; primary #00d992 (soft #2fd6a1, deep #10b981, on-primary #0a0a0a);
ink #f2f2f2 / strong #fff / body #bdbdbd / mute #8b949e. Inter + JetBrains Mono. Card radius 8px, button/input 6px, pill 9999px.
Eyebrow = mono-style uppercase, weight 600, tracking 2.52px, green. Status pill "live" = green dot + green text.
