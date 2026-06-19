"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/portal/ui";
import {
  createCourseAction,
  createRecurringCoursesAction,
  type ActionState,
  type RecurringActionState,
} from "@/app/portal/actions";
import { DatePicker } from "@/components/portal/date-picker";
import {
  timeRange,
  generateSeriesDates,
  seriesHorizonEndISO,
} from "@/lib/dates";
import { WEEKDAYS_SHORT } from "@/lib/constants";
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

const INTERVAL_OPTIONS = [
  { value: 1, label: "Jede Woche" },
  { value: 2, label: "Alle 2 Wochen" },
  { value: 3, label: "Alle 3 Wochen" },
] as const;

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const jsDay = new Date(Number(y), Number(m) - 1, Number(d)).getDay();
  return `${days[jsDay]}, ${d}.${m}.`;
}

export function KursErstellenForm({
  locations,
  trainers,
  existing,
  minDate,
  maxDate,
  isAdmin,
}: {
  locations: LocationGroup[];
  trainers: Trainer[];
  existing: ExistingCourse[];
  minDate: string;
  maxDate: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const seriesMaxDate = useMemo(() => seriesHorizonEndISO(), []);

  // Single-course action state
  const [singleState, singleFormAction, singlePending] = useActionState<
    ActionState,
    FormData
  >(async (prev, fd) => {
    const res = await createCourseAction(prev, fd);
    if (res.message) router.refresh();
    return res;
  }, {});

  // Recurring series action state
  const [recurringState, recurringFormAction, recurringPending] = useActionState<
    RecurringActionState,
    FormData
  >(async (prev, fd) => {
    const res = await createRecurringCoursesAction(prev, fd);
    if (res.created) router.refresh();
    return res;
  }, {} as RecurringActionState);

  // Course fields (shared by both modes)
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [maxP, setMaxP] = useState(20);
  const [status, setStatus] = useState<CourseStatus>("regulaer");

  // Recurring-only fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [intervalWeeks, setIntervalWeeks] = useState(1);
  const [seriesStart, setSeriesStart] = useState(minDate);
  const [seriesEnd, setSeriesEnd] = useState(seriesMaxDate);

  const rooms = useMemo(
    () => locations.find((l) => l.id === locationId)?.rooms ?? [],
    [locations, locationId],
  );

  const validTimes = !!date && end > start;

  const roomBusy = (rid: string) =>
    validTimes && existing.some((e) => e.room_id === rid && overlaps({ date, start, end }, e));

  // Single-course conflicts
  const inHorizon = !!date && date >= minDate && date <= maxDate;
  const roomConflict = roomId ? roomBusy(roomId) : false;
  const trainerConflict =
    !!trainerId &&
    validTimes &&
    existing.some((e) => e.trainer_id === trainerId && overlaps({ date, start, end }, e));

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const selectedTrainer = trainers.find((t) => t.id === trainerId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  function toggleDay(dow: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dow)) next.delete(dow);
      else next.add(dow);
      return next;
    });
  }

  // Series: generated dates + per-date conflict map
  const generatedDates = useMemo(
    () =>
      isRecurring && end > start
        ? generateSeriesDates(
            seriesStart,
            seriesEnd,
            [...selectedDays].sort((a, b) => a - b),
            intervalWeeks,
          )
        : [],
    [isRecurring, seriesStart, seriesEnd, selectedDays, intervalWeeks, start, end],
  );

  const dateConflicts = useMemo(() => {
    const map = new Map<string, { room: boolean; trainer: boolean }>();
    for (const d of generatedDates) {
      const slot = { date: d, start, end };
      map.set(d, {
        room: !!roomId && existing.some((e) => e.room_id === roomId && overlaps(slot, e)),
        trainer:
          !!trainerId &&
          existing.some((e) => e.trainer_id === trainerId && overlaps(slot, e)),
      });
    }
    return map;
  }, [generatedDates, roomId, trainerId, start, end, existing]);

  const conflictCount = [...dateConflicts.values()].filter(
    (c) => c.room || c.trainer,
  ).length;
  const cleanCount = generatedDates.length - conflictCount;

  const SELECT_CLS =
    "h-10 rounded-md border border-hairline bg-(--color-canvas-soft) px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ---------- Form ---------- */}
      <form action={singleFormAction} className="flex flex-col gap-5">
        {/* Shared hidden inputs */}
        <input type="hidden" name="room_id" value={roomId} />
        <input type="hidden" name="trainer_id" value={trainerId} />
        <input type="hidden" name="status" value={status} />

        {/* Series hidden inputs (only submitted; recurring action reads them) */}
        <input
          type="hidden"
          name="series_weekdays"
          value={[...selectedDays].sort((a, b) => a - b).join(",")}
        />
        <input type="hidden" name="series_interval" value={intervalWeeks} />
        <input type="hidden" name="series_start" value={seriesStart} />
        <input type="hidden" name="series_end" value={seriesEnd} />

        {/* Name */}
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

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Kurze Beschreibung des Kurses…"
            rows={3}
          />
        </div>

        {/* Date / time — single date only shown in single mode */}
        {!isRecurring ? (
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Startzeit *</Label>
              <TimePicker name="start_time" value={start} onChange={setStart} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Endzeit *</Label>
              <TimePicker name="end_time" value={end} onChange={setEnd} />
            </div>
          </div>
        )}

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
            className={SELECT_CLS}
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
                  disabled={busy && !isRecurring}
                  onClick={() => {
                    setRoomId(r.id);
                    setMaxP(r.capacity);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-hairline hover:border-hairline/70",
                    busy && !isRecurring && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="text-sm font-medium text-ink-strong">
                    {r.name}
                  </span>
                  <span className="font-numeric text-xs text-muted-foreground">
                    {r.capacity} Plätze
                  </span>
                  {!isRecurring && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        busy
                          ? "bg-status-abgesagt/15 text-(--color-status-abgesagt)"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      {busy ? "belegt" : "frei"}
                    </span>
                  )}
                </button>
              );
            })}
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Keine Räume an diesem Standort.
              </p>
            )}
          </div>
        </div>

        {/* Trainer + Max */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="trainer">Trainer</Label>
            <select
              id="trainer"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">— auswählen —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

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
                    Math.min(selectedRoom ? selectedRoom.capacity : 999, v + 1),
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
            className={SELECT_CLS}
          >
            <option value="regulaer">Regulär</option>
            <option value="vertreten">Vertreten</option>
            <option value="abgesagt">Abgesagt</option>
          </select>
        </div>

        {/* ---- Recurring section (admin only) ---- */}
        {isAdmin && (
          <div className="rounded-md border border-hairline bg-(--color-canvas-soft) p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="size-4 accent-(--color-primary)"
              />
              <span className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
                <RefreshCw className="size-4 text-primary" />
                Wiederkehrender Kurs (Serie)
              </span>
            </label>

            {isRecurring && (
              <div className="mt-4 flex flex-col gap-4 border-t border-hairline/50 pt-4">
                {/* Wochentage */}
                <div className="flex flex-col gap-2">
                  <Label>Wochentage</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS_SHORT.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "size-10 rounded-md border text-xs font-semibold transition-colors",
                          selectedDays.has(i)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-hairline text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intervall */}
                <div className="flex flex-col gap-2">
                  <Label>Intervall</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERVAL_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setIntervalWeeks(value)}
                        className={cn(
                          "rounded-md border px-4 py-2 text-xs font-medium transition-colors",
                          intervalWeeks === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-hairline text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zeitraum */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="series-start">Serienbeginn</Label>
                    <input
                      id="series-start"
                      type="date"
                      value={seriesStart}
                      min={minDate}
                      max={seriesMaxDate}
                      onChange={(e) => setSeriesStart(e.target.value)}
                      className="h-10 rounded-md border border-hairline bg-(--color-canvas) px-3 font-numeric text-sm text-body outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="series-end">Serienende</Label>
                    <input
                      id="series-end"
                      type="date"
                      value={seriesEnd}
                      min={seriesStart || minDate}
                      max={seriesMaxDate}
                      onChange={(e) => setSeriesEnd(e.target.value)}
                      className="h-10 rounded-md border border-hairline bg-(--color-canvas) px-3 font-numeric text-sm text-body outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Serien können maximal 4 Wochen im Voraus geplant werden. Termine mit Raum- oder Trainer-Konflikt werden automatisch übersprungen.
                </p>
              </div>
            )}
          </div>
        )}

        {!isRecurring && (
          <p className="rounded-md border border-hairline bg-(--color-canvas-soft) px-3 py-2 text-xs text-muted-foreground">
            Kurse können nur für die nächsten zwei Wochen geplant werden.
          </p>
        )}

        {/* Messages — single mode */}
        {!isRecurring && singleState.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {singleState.error}
          </p>
        ) : null}
        {!isRecurring && singleState.message ? (
          <p
            role="status"
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
          >
            {singleState.message}
          </p>
        ) : null}

        {/* Messages — recurring mode */}
        {isRecurring && recurringState.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {recurringState.error}
          </p>
        ) : null}
        {isRecurring && recurringState.message ? (
          <div
            role="status"
            className="flex flex-col gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
          >
            <span>{recurringState.message}</span>
            {recurringState.skipped?.length ? (
              <span className="text-xs text-muted-foreground">
                {recurringState.skipped.length} Termin
                {recurringState.skipped.length !== 1 ? "e" : ""} übersprungen
                (Konflikte).
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Submit */}
        <div className="flex gap-3">
          {!isRecurring ? (
            <Button
              type="submit"
              disabled={singlePending || !!trainerConflict || roomConflict}
              className="font-semibold"
            >
              {singlePending ? "Wird angelegt…" : "Kurs anlegen"}
            </Button>
          ) : (
            <Button
              type="submit"
              formAction={recurringFormAction}
              disabled={
                recurringPending ||
                selectedDays.size === 0 ||
                !(end > start) ||
                cleanCount === 0
              }
              className="font-semibold"
            >
              {recurringPending
                ? "Wird erstellt…"
                : cleanCount > 0
                  ? `${cleanCount} Termin${cleanCount !== 1 ? "e" : ""} anlegen`
                  : "Keine Termine verfügbar"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/portal/kurse")}
          >
            Abbrechen
          </Button>
        </div>
      </form>

      {/* ---------- Right panel ---------- */}
      <div className="flex flex-col gap-4">
        {/* Vorschau */}
        <div className="card-hairline p-5">
          <p className="eyebrow mb-3">Vorschau</p>
          <h3 className="text-lg font-semibold text-ink-strong">
            {name || "Neuer Kurs"}
          </h3>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="Uhrzeit">
              <span className="font-numeric">
                {end > start ? timeRange(start, end) : "—"}
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

        {/* Single: conflict check  |  Recurring: date list */}
        {!isRecurring ? (
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
        ) : (
          <div className="card-hairline p-5">
            <div className="eyebrow mb-3 flex items-center justify-between">
              <span>Termine</span>
              {generatedDates.length > 0 && (
                <span className="font-numeric text-[11px] text-muted-foreground">
                  {cleanCount} frei · {conflictCount} Konflikt
                  {conflictCount !== 1 ? "e" : ""}
                </span>
              )}
            </div>

            {selectedDays.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Wochentage auswählen…
              </p>
            ) : generatedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Termine im gewählten Zeitraum.
              </p>
            ) : (
              <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                {generatedDates.map((d) => {
                  const cf = dateConflicts.get(d);
                  const hasConflict = !!(cf?.room || cf?.trainer);
                  const reason = cf?.room && cf?.trainer
                    ? "Raum + Trainer"
                    : cf?.room
                      ? "Raum belegt"
                      : cf?.trainer
                        ? "Trainer belegt"
                        : null;
                  return (
                    <li
                      key={d}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span
                        className={cn(
                          "font-numeric",
                          hasConflict &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {shortDate(d)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          hasConflict
                            ? "bg-status-abgesagt/15 text-(--color-status-abgesagt)"
                            : "bg-primary/15 text-primary",
                        )}
                      >
                        {hasConflict ? reason : "frei"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

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

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
