"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/portal/date-picker";
import { StatusPill } from "@/components/portal/ui";
import {
  submitSickLeaveAction,
  type SickLeaveState,
} from "@/app/portal/actions";
import { formatDayLong, timeRange } from "@/lib/dates";
import type { CourseStatus } from "@/lib/database.types";

type MyCourse = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: CourseStatus;
};

export function KrankmeldungForm({
  minDate,
  maxDate,
  myCourses,
}: {
  minDate: string;
  maxDate: string;
  myCourses: MyCourse[];
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    SickLeaveState,
    FormData
  >(async (prev, fd) => {
    const res = await submitSickLeaveAction(prev, fd);
    if (res.message) router.refresh();
    return res;
  }, {});

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const affected = useMemo(() => {
    if (!start || !end) return [];
    return myCourses.filter(
      (c) => c.date >= start && c.date <= end && c.status === "regulaer",
    );
  }, [myCourses, start, end]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="start_date">Startdatum *</Label>
            <DatePicker
              id="start_date"
              name="start_date"
              min={minDate}
              max={maxDate}
              value={start}
              onChange={setStart}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="end_date">Enddatum *</Label>
            <DatePicker
              id="end_date"
              name="end_date"
              min={start || minDate}
              max={maxDate}
              value={end}
              onChange={setEnd}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Grund (optional)</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={3}
            placeholder="z. B. Erkältung"
          />
        </div>

        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-body">
            Nach dem Speichern sucht das System automatisch nach Vertretungen.
            Wenn keine Vertretung verfügbar ist, wird der betroffene Kurs
            abgesagt.
          </p>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending} className="self-start font-semibold">
          {isPending ? "Wird gespeichert…" : "Krankmeldung speichern"}
        </Button>
      </form>

      {/* Right column: betroffene Kurse + Ergebnis */}
      <div className="flex flex-col gap-4">
        <div className="card-hairline p-5">
          <p className="eyebrow mb-3">Betroffene Kurse</p>
          {affected.length ? (
            <ul className="flex flex-col gap-2">
              {affected.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-body">{c.name}</span>
                  <span className="font-numeric text-xs text-muted-foreground">
                    {formatDayLong(c.date).split(",")[0]} ·{" "}
                    {timeRange(c.start_time, c.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {start && end
                ? "Keine regulären Kurse im gewählten Zeitraum."
                : "Wähle einen Zeitraum, um betroffene Kurse zu sehen."}
            </p>
          )}
        </div>

        <div className="card-hairline p-5">
          <p className="eyebrow mb-3">Ergebnis der automatischen Prüfung</p>
          {state.results && state.results.length ? (
            <ul className="flex flex-col gap-3">
              {state.results.map((r) => (
                <li key={r.course_id} className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink-strong">
                      {r.course_name}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {r.status === "vertreten" ? (
                      <span className="flex items-center gap-1 text-(--color-status-vertreten)">
                        <Check className="size-3.5" />
                        Vertretung gefunden
                        <ArrowRight className="size-3" />
                        <span className="text-body">{r.substitute_name}</span>
                      </span>
                    ) : r.status === "abgesagt" ? (
                      <span className="flex items-center gap-1 text-(--color-status-abgesagt)">
                        <X className="size-3.5" />
                        {r.cancel_reason ?? "Abgesagt"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unverändert</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : state.message ? (
            <p className="text-sm text-muted-foreground">
              Keine betroffenen Kurse im gewählten Zeitraum.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Das Ergebnis erscheint hier nach dem Speichern.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
