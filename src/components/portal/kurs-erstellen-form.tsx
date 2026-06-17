"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/portal/ui";
import { createCourseAction, type ActionState } from "@/app/portal/actions";
import { DatePicker } from "@/components/portal/date-picker";
import { timeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/lib/database.types";

type Room = { id: string; name: string; capacity: number };
type LocationGroup = { id: string; name: string; rooms: Room[] };
type Trainer = { id: string; full_name: string };
type ExistingCourse = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  room_id: string | null;
  trainer_id: string | null;
  status: CourseStatus;
};

function overlaps(
  a: { date: string; start: string; end: string },
  b: ExistingCourse,
) {
  return (
    a.date === b.date &&
    b.status !== "abgesagt" &&
    a.start < b.end_time &&
    a.end > b.start_time
  );
}

export function KursErstellenForm({
  locations,
  trainers,
  existing,
  minDate,
  maxDate,
}: {
  locations: LocationGroup[];
  trainers: Trainer[];
  existing: ExistingCourse[];
  minDate: string;
  maxDate: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const res = await createCourseAction(prev, fd);
      if (res.message) router.refresh();
      return res;
    },
    {},
  );

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [maxP, setMaxP] = useState(20);
  const [status, setStatus] = useState<CourseStatus>("regulaer");

  const rooms = useMemo(
    () => locations.find((l) => l.id === locationId)?.rooms ?? [],
    [locations, locationId],
  );

  useEffect(() => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) setMaxP(room.capacity - 1);
  }, [roomId, rooms]);

  const slot = { date, start, end };
  const validTimes = !!date && end > start;

  const roomBusy = (rid: string) =>
    validTimes &&
    existing.some((e) => e.room_id === rid && overlaps(slot, e));

  // conflict checks
  const inHorizon = !!date && date >= minDate && date <= maxDate;
  const roomConflict = roomId ? roomBusy(roomId) : false;
  const trainerConflict =
    trainerId &&
    validTimes &&
    existing.some((e) => e.trainer_id === trainerId && overlaps(slot, e));

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const selectedTrainer = trainers.find((t) => t.id === trainerId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ---------- Form ---------- */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="room_id" value={roomId} />
        <input type="hidden" name="trainer_id" value={trainerId} />
        <input type="hidden" name="status" value={status} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Kursname *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Yoga Basics"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Kurze Beschreibung des Kurses…"
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Datum *</Label>
            <DatePicker
              id="date"
              name="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={setDate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Startzeit *</Label>
            <TimePicker name="start_time" value={start} onChange={setStart} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Endzeit *</Label>
            <TimePicker name="end_time" value={end} onChange={setEnd} />
          </div>
        </div>

        {/* Standort */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="standort">Standort</Label>
          <select
            id="standort"
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              setRoomId("");
            }}
            className="h-10 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 text-sm outline-none focus:border-primary"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Raum grid */}
        <div className="flex flex-col gap-2">
          <Label>Raum</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rooms.map((r) => {
              const busy = roomBusy(r.id);
              const active = roomId === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  disabled={busy}
                  onClick={() => setRoomId(r.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-hairline hover:border-hairline/70",
                    busy && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="text-sm font-medium text-ink-strong">
                    {r.name}
                  </span>
                  <span className="font-numeric text-xs text-muted-foreground">
                    {r.capacity - 1} Plätze
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      busy
                        ? "bg-[var(--color-status-abgesagt)]/15 text-[var(--color-status-abgesagt)]"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {busy ? "belegt" : "frei"}
                  </span>
                </button>
              );
            })}
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Räume an diesem Standort.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Trainer */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="trainer">Trainer</Label>
            <select
              id="trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="h-10 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">— auswählen —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Teilnehmer */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="max_participants">Max. Teilnehmer</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setMaxP((v) => Math.max(1, v - 1))}
              >
                –
              </Button>
              <Input
                id="max_participants"
                name="max_participants"
                type="number"
                min={1}
                value={maxP}
                onChange={(e) => setMaxP(Number(e.target.value) || 1)}
                className="text-center font-numeric"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setMaxP((v) =>
                    Math.min(
                      selectedRoom ? selectedRoom.capacity - 1 : 999,
                      v + 1,
                    ),
                  )
                }
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus)}
            className="h-10 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 text-sm outline-none focus:border-primary"
          >
            <option value="regulaer">Regulär</option>
            <option value="vertreten">Vertreten</option>
            <option value="abgesagt">Abgesagt</option>
          </select>
        </div>

        <p className="rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 py-2 text-xs text-muted-foreground">
          Kurse können nur für die nächsten zwei Wochen geplant werden.
        </p>

        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p
            role="status"
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="font-semibold">
            {isPending ? "Wird angelegt…" : "Kurs anlegen"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/portal/kurse")}
          >
            Abbrechen
          </Button>
        </div>
      </form>

      {/* ---------- Preview + conflict check ---------- */}
      <div className="flex flex-col gap-4">
        <div className="card-hairline p-5">
          <p className="eyebrow mb-3">Vorschau</p>
          <h3 className="text-lg font-semibold text-ink-strong">
            {name || "Neuer Kurs"}
          </h3>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Uhrzeit">
              <span className="font-numeric">
                {validTimes ? timeRange(start, end) : "—"}
              </span>
            </Row>
            <Row label="Raum">
              {selectedRoom
                ? `${selectedRoom.name} · ${selectedLocation?.name ?? ""}`
                : "—"}
            </Row>
            <Row label="Trainer">{selectedTrainer?.full_name ?? "—"}</Row>
            <Row label="Limit">
              <span className="font-numeric">{maxP}</span>
            </Row>
            <Row label="Status">
              <StatusPill status={status} />
            </Row>
          </dl>
        </div>

        <div className="card-hairline p-5">
          <p className="eyebrow mb-3">Konflikt-Check</p>
          <ul className="flex flex-col gap-3 text-sm">
            <CheckRow
              ok={!roomConflict}
              label="Raum frei"
              warn={!roomId ? "Kein Raum gewählt" : undefined}
              bad="Raum ist belegt"
            />
            <CheckRow
              ok={!trainerConflict}
              label="Trainer verfügbar"
              warn={!trainerId ? "Kein Trainer gewählt" : undefined}
              bad="Trainer ist zu dieser Zeit gebucht"
            />
            <CheckRow
              ok={inHorizon}
              label="Im Zwei-Wochen-Zeitraum"
              warn={!date ? "Kein Datum gewählt" : undefined}
              bad="Außerhalb der nächsten zwei Wochen"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

function TimePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const mSnapped = Math.round(m / 15) * 15;
  const mFinal = mSnapped >= 60 ? 45 : mSnapped;

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={h}
        onChange={(e) =>
          onChange(
            `${String(Number(e.target.value)).padStart(2, "0")}:${String(mFinal).padStart(2, "0")}`,
          )
        }
        aria-label="Stunde"
        className="h-10 w-18 rounded-md border border-hairline bg-(--color-canvas-soft) px-2 font-numeric text-sm text-body outline-none focus:border-primary"
      >
        {Array.from({ length: 21 }, (_, i) => i).map((hh) => (
          <option key={hh} value={hh}>
            {String(hh).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="font-numeric font-medium text-muted-foreground">:</span>
      <select
        value={mFinal}
        onChange={(e) =>
          onChange(
            `${String(h).padStart(2, "0")}:${String(Number(e.target.value)).padStart(2, "0")}`,
          )
        }
        aria-label="Minute"
        className="h-10 w-18 rounded-md border border-hairline bg-(--color-canvas-soft) px-2 font-numeric text-sm text-body outline-none focus:border-primary"
      >
        {[0, 15, 30, 45].map((mm) => (
          <option key={mm} value={mm}>
            {String(mm).padStart(2, "0")}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

function CheckRow({
  ok,
  label,
  warn,
  bad,
}: {
  ok: boolean;
  label: string;
  warn?: string;
  bad: string;
}) {
  if (warn) {
    return (
      <li className="flex items-center gap-2 text-muted-foreground">
        <CircleAlert className="size-4" />
        <span>{warn}</span>
      </li>
    );
  }
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        ok ? "text-primary" : "text-[var(--color-status-abgesagt)]",
      )}
    >
      {ok ? <Check className="size-4" /> : <X className="size-4" />}
      <span>{ok ? label : bad}</span>
    </li>
  );
}
