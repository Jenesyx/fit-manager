"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/portal/ui";
import {
  updateCourseAction,
  deleteCourseAction,
  deleteCoursesAction,
  setCourseArchivedAction,
  type ActionState,
} from "@/app/portal/actions";
import { formatTime, timeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/lib/database.types";

export type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  room_id: string | null;
  room_name: string | null;
  location_name: string | null;
  trainer_id: string | null;
  trainer_name: string | null;
  substitute_name: string | null;
  max_participants: number;
  status: CourseStatus;
  archived: boolean;
  registered: number;
};

type RoomOpt = { id: string; name: string; capacity: number };
type LocationGroup = { id: string; name: string; rooms: RoomOpt[] };
type TrainerOpt = { id: string; full_name: string };

const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: "regulaer", label: "Regulär" },
  { value: "vertreten", label: "Vertreten" },
  { value: "abgesagt", label: "Abgesagt" },
];

const SELECT_CLS =
  "h-10 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 text-sm outline-none focus:border-primary";

/** "2026-05-19" → "19.05.2026" (no locale dependency). */
function dmy(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function KursVerwaltung({
  courses,
  locations,
  trainers,
}: {
  courses: CourseRow[];
  locations: LocationGroup[];
  trainers: TrainerOpt[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"alle" | CourseStatus>(
    "alle",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [deleting, setDeleting] = useState<CourseRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (!showArchived && c.archived) return false;
      if (statusFilter !== "alle" && c.status !== statusFilter) return false;
      if (
        q &&
        !`${c.name} ${c.trainer_name ?? ""} ${c.room_name ?? ""} ${c.location_name ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [courses, query, statusFilter, showArchived]);

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const allSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected =
    !allSelected && filteredIds.some((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Filter bar ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Kurs, Trainer, Raum…"
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "alle" | CourseStatus)
          }
          className={SELECT_CLS}
        >
          <option value="alle">Alle Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4 accent-[var(--color-primary)]"
          />
          Archivierte zeigen
        </label>
      </div>

      {/* ---------- Bulk action bar ---------- */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-4 py-2.5 text-sm">
          <span className="font-medium text-ink-strong">
            {selected.size} ausgewählt
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkOpen(true)}
          >
            <Trash2 className="size-4" />
            Löschen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Auswahl aufheben
          </Button>
        </div>
      ) : null}

      {/* ---------- Table ---------- */}
      <div className="card-hairline overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  aria-label="Alle auswählen"
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 accent-[var(--color-primary)] align-middle"
                />
              </th>
              <th className="px-5 py-3 font-medium">Kurs</th>
              <th className="px-5 py-3 font-medium">Datum</th>
              <th className="px-5 py-3 font-medium">Zeit</th>
              <th className="px-5 py-3 font-medium">Raum</th>
              <th className="px-5 py-3 font-medium">Trainer</th>
              <th className="px-5 py-3 font-medium">Belegung</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className={cn(
                  "border-b border-hairline/50 last:border-0 align-top",
                  c.archived && "opacity-55",
                  selected.has(c.id) && "bg-[var(--color-canvas-soft)]",
                )}
              >
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label={`„${c.name}“ auswählen`}
                    checked={selected.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    className="size-4 accent-[var(--color-primary)] align-middle"
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-strong">{c.name}</div>
                  {c.archived ? (
                    <span className="text-xs text-muted-foreground">
                      Archiviert
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-3 font-numeric whitespace-nowrap text-body">
                  {dmy(c.date)}
                </td>
                <td className="px-5 py-3 font-numeric whitespace-nowrap text-body">
                  {timeRange(c.start_time, c.end_time)}
                </td>
                <td className="px-5 py-3 text-body">
                  {c.room_name ?? "—"}
                  {c.location_name ? (
                    <span className="block text-xs text-muted-foreground">
                      {c.location_name}
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-body">
                  {c.status === "vertreten" ? (
                    <span>
                      {c.substitute_name ?? "Vertretung"}
                      <span className="block text-xs text-muted-foreground">
                        für {c.trainer_name ?? "—"}
                      </span>
                    </span>
                  ) : (
                    (c.trainer_name ?? "—")
                  )}
                </td>
                <td className="px-5 py-3 font-numeric whitespace-nowrap text-body">
                  {c.registered}/{c.max_participants}
                </td>
                <td className="px-5 py-3">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Bearbeiten"
                      onClick={() => setEditing(c)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ArchiveButton row={c} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Löschen"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="size-4 text-[var(--color-status-abgesagt)]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  Keine Kurse gefunden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* ---------- Edit dialog ---------- */}
      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {editing ? (
            <EditForm
              key={editing.id}
              row={editing}
              locations={locations}
              trainers={trainers}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---------- Delete confirm ---------- */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <DialogContent>
          {deleting ? (
            <DeleteConfirm
              row={deleting}
              onDone={() => setDeleting(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---------- Bulk delete confirm ---------- */}
      <Dialog open={bulkOpen} onOpenChange={(o) => !o && setBulkOpen(false)}>
        <DialogContent>
          {bulkOpen ? (
            <BulkDeleteConfirm
              ids={[...selected]}
              count={selected.size}
              onDone={() => {
                setBulkOpen(false);
                setSelected(new Set());
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Bulk delete confirmation ---------- */
function BulkDeleteConfirm({
  ids,
  count,
  onDone,
}: {
  ids: string[];
  count: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const noun = count === 1 ? "Kurs" : "Kurse";
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-[var(--color-status-abgesagt)]" />
          {count} {noun} löschen
        </DialogTitle>
        <DialogDescription>
          {count} ausgewählte {noun} werden endgültig gelöscht. Alle Anmeldungen
          dazu gehen verloren. Dies kann nicht rückgängig gemacht werden.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Abbrechen
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("ids", ids.join(","));
              await deleteCoursesAction(fd);
              router.refresh();
              onDone();
            })
          }
        >
          {pending ? "Wird gelöscht…" : `${count} ${noun} löschen`}
        </Button>
      </div>
    </>
  );
}

/* ---------- Archive / restore button (inline form action) ---------- */
function ArchiveButton({ row }: { row: CourseRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const archive = !row.archived;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      title={archive ? "Archivieren" : "Wiederherstellen"}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("id", row.id);
          fd.set("archived", String(archive));
          await setCourseArchivedAction(fd);
          router.refresh();
        })
      }
    >
      {archive ? (
        <Archive className="size-4" />
      ) : (
        <ArchiveRestore className="size-4 text-primary" />
      )}
    </Button>
  );
}

/* ---------- Delete confirmation ---------- */
function DeleteConfirm({
  row,
  onDone,
}: {
  row: CourseRow;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-[var(--color-status-abgesagt)]" />
          Kurs löschen
        </DialogTitle>
        <DialogDescription>
          „{row.name}“ am {dmy(row.date)} wird endgültig gelöscht. Alle
          Anmeldungen dazu gehen verloren. Tipp: Statt löschen kannst du den
          Kurs auch archivieren.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Abbrechen
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("id", row.id);
              await deleteCourseAction(fd);
              router.refresh();
              onDone();
            })
          }
        >
          {pending ? "Wird gelöscht…" : "Endgültig löschen"}
        </Button>
      </div>
    </>
  );
}

/* ---------- Edit form ---------- */
function EditForm({
  row,
  locations,
  trainers,
  onDone,
}: {
  row: CourseRow;
  locations: LocationGroup[];
  trainers: TrainerOpt[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    (prev, fd) => updateCourseAction(prev, fd),
    {},
  );

  const initialLocationId =
    locations.find((l) => l.rooms.some((r) => r.id === row.room_id))?.id ??
    locations[0]?.id ??
    "";

  const [locationId, setLocationId] = useState(initialLocationId);
  const [roomId, setRoomId] = useState(row.room_id ?? "");

  const rooms = useMemo(
    () => locations.find((l) => l.id === locationId)?.rooms ?? [],
    [locations, locationId],
  );

  // Close + refresh once the server confirms the update.
  useEffect(() => {
    if (state.message) {
      router.refresh();
      onDone();
    }
  }, [state.message, router, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Kurs bearbeiten</DialogTitle>
        <DialogDescription>{row.name}</DialogDescription>
      </DialogHeader>

      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="room_id" value={roomId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-name">Kursname *</Label>
        <Input id="ev-name" name="name" defaultValue={row.name} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-desc">Beschreibung</Label>
        <Textarea
          id="ev-desc"
          name="description"
          defaultValue={row.description ?? ""}
          rows={2}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-date">Datum *</Label>
          <input
            id="ev-date"
            name="date"
            type="date"
            defaultValue={row.date}
            required
            className={SELECT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-start">Start *</Label>
          <input
            id="ev-start"
            name="start_time"
            type="time"
            defaultValue={formatTime(row.start_time)}
            required
            className={SELECT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-end">Ende *</Label>
          <input
            id="ev-end"
            name="end_time"
            type="time"
            defaultValue={formatTime(row.end_time)}
            required
            className={SELECT_CLS}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-loc">Standort</Label>
          <select
            id="ev-loc"
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-room">Raum</Label>
          <select
            id="ev-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">— kein Raum —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity} Plätze)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="ev-trainer">Trainer</Label>
          <select
            id="ev-trainer"
            name="trainer_id"
            defaultValue={row.trainer_id ?? ""}
            className={SELECT_CLS}
          >
            <option value="">— kein Trainer —</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ev-max">Max.</Label>
          <Input
            id="ev-max"
            name="max_participants"
            type="number"
            min={1}
            defaultValue={row.max_participants}
            className="font-numeric"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ev-status">Status</Label>
        <select
          id="ev-status"
          name="status"
          defaultValue={row.status}
          className={SELECT_CLS}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isPending} className="font-semibold">
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
