# Änderungen – Trainer-Konfliktprüfung mit Standortlogik

## Geänderte Dateien

### 1. `src/lib/dates.ts`

**Neu hinzugefügte Hilfsfunktion:**

```ts
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
```

**Erklärung:**  
Wandelt eine Uhrzeit im Format `"HH:MM:SS"` oder `"HH:MM"` in Minuten seit Mitternacht um. Wird benötigt, um Zeitabstände zwischen Kursen berechnen zu können.

---

### 2. `src/app/portal/actions.ts`

**Betroffen:** Alle drei Trainer-Konfliktprüfungen:
- `createCourseAction` (Kurs erstellen)
- `updateCourseAction` (Kurs bearbeiten)
- `createRecurringCoursesAction` (Wiederkehrende Serie)

#### Alte Logik (alle drei Stellen):

```ts
// Nur direkte Zeitüberschneidung geprüft
const { data: trainerClash } = await supabase
  .from("courses")
  .select("id")
  .eq("trainer_id", trainer_id)
  .eq("date", date)
  .neq("status", "abgesagt")
  .lt("start_time", end_time)
  .gt("end_time", start_time)
  .limit(1);
if (trainerClash && trainerClash.length > 0)
  return { error: "Dieser Trainer ist zu dieser Zeit bereits belegt." };
```

**Problem:** Ein Trainer mit Kurs 09:00–10:00 konnte keinen Kurs 10:00–11:00 übernehmen, obwohl direkt aufeinanderfolgende Kurse im selben Studio problemlos möglich sind.

#### Neue Logik (alle drei Stellen):

```ts
// 1. Standort (location_id) des neuen Kurses laden
let newLocationId: string | null = null;
if (room_id) {
  const { data: newRoom } = await supabase
    .from("rooms").select("location_id").eq("id", room_id).maybeSingle();
  newLocationId = newRoom?.location_id ?? null;
}

// 2. Alle bestehenden Kurse des Trainers an diesem Tag laden
const { data: trainerCourses } = await supabase
  .from("courses")
  .select("start_time, end_time, room_id")
  .eq("trainer_id", trainer_id)
  .eq("date", date)
  .neq("status", "abgesagt");

// 3. Standorte der Räume der bestehenden Kurse laden
const roomLocationMap: Record<string, string> = {};
// ... (Räume per .in("id", roomIds) abfragen)

// 4. Prüfung pro bestehendem Kurs
for (const c of trainerCourses) {
  const sameLocation = newLocationId !== null && existingLocId !== null
    && newLocationId === existingLocId;

  if (sameLocation) {
    // Gleiches Studio: nur direkte Überschneidung ist ein Konflikt
    if (newS < ee && es < newE)
      return { error: "Dieser Trainer ist zu dieser Zeit bereits belegt." };
  } else {
    // Anderes Studio: mindestens 60 Minuten Pause erforderlich
    if (newS < ee + 60 && es < newE + 60)
      return {
        error: "Dieser Trainer benötigt mindestens 60 Minuten Pause zwischen Kursen in verschiedenen Studios.",
      };
  }
}
```

**Erklärung der Regeländerung:**

| Situation | Alte Regel | Neue Regel |
|---|---|---|
| Selbes Studio, Kurs direkt anschließend (z. B. 09–10 dann 10–11) | ❌ Blockiert | ✅ Erlaubt |
| Selbes Studio, Zeitüberschneidung | ❌ Blockiert | ❌ Blockiert |
| Anderes Studio, weniger als 60 Min. Pause | ✅ Erlaubt (Bug) | ❌ Blockiert |
| Anderes Studio, mindestens 60 Min. Pause | ✅ Erlaubt | ✅ Erlaubt |

**Wichtige Details:**
- `location_id` kommt aus der Tabelle `rooms` (über `room_id`), die wiederum auf `locations` verweist.
- Wenn Raum unbekannt (kein `room_id`): konservativ → 60-Minuten-Regel gilt.
- In der Serie (`createRecurringCoursesAction`): Standort-Map wird einmalig vor der Schleife geladen, kein Extra-Query pro Datum.
- Die `ExistingSlot`-Typdefinition in der Serie wurde um `location_id: string | null` erweitert.
- Shadow-Einträge (eigene Serieneinträge die noch eingefügt werden) bekommen `location_id: seriesLocationId`.
