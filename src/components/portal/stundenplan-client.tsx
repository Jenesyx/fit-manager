"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import {
  WEEKDAYS_SHORT,
  DAY_START_HOUR,
  DAY_END_HOUR,
  STATUS_META,
} from "@/lib/constants";
import {
  addDays,
  format,
  parseISO,
  weekLabel,
  timeRange,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/lib/database.types";

export type PlanCourse = {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: CourseStatus;
  room_name: string | null;
  location_name: string | null;
  trainer_name: string | null;
  original_name: string | null;
  substitute_name: string | null;
  cancel_reason: string | null;
  max_participants: number;
};

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);
const HOUR_PX = 56;
const TOTAL_MIN = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Monday index (Mon=0 … Sun=6) for an ISO date. */
function weekdayIndex(dateISO: string) {
  const d = parseISO(dateISO).getDay(); // 0=Sun
  return (d + 6) % 7;
}

export function StundenplanClient({
  courses,
  weekStarts,
}: {
  courses: PlanCourse[];
  /** ISO date strings of allowed Monday week-starts (within horizon). */
  weekStarts: string[];
}) {
  const [weekIdx, setWeekIdx] = useState(0);
  const monday = parseISO(weekStarts[weekIdx] ?? weekStarts[0]);
  const todayISOStr = format(new Date(), "yyyy-MM-dd");

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday],
  );

  const weekCourses = useMemo(() => {
    const start = format(monday, "yyyy-MM-dd");
    const end = format(addDays(monday, 6), "yyyy-MM-dd");
    return courses.filter((c) => c.date >= start && c.date <= end);
  }, [courses, monday]);

  const nowMinutes = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();
  const showNowLine = nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= DAY_END_HOUR * 60;
  const nowTop = ((nowMinutes - DAY_START_HOUR * 60) / TOTAL_MIN) * (HOURS.length - 1) * HOUR_PX;

  return (
    <div>
      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-numeric text-lg font-medium text-ink-strong">
          {weekLabel(monday)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={weekIdx === 0}
            onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
            className="flex size-9 items-center justify-center rounded-md border border-hairline text-body transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            disabled={weekIdx >= weekStarts.length - 1}
            onClick={() =>
              setWeekIdx((i) => Math.min(weekStarts.length - 1, i + 1))
            }
            className="flex size-9 items-center justify-center rounded-md border border-hairline text-body transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-30"
            aria-label="Nächste Woche"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="card-hairline overflow-x-auto p-4">
        <div className="grid min-w-[820px] grid-cols-[56px_repeat(7,1fr)] gap-px">
          {/* Header row */}
          <div />
          {days.map((d, i) => {
            const iso = format(d, "yyyy-MM-dd");
            const isToday = iso === todayISOStr;
            return (
              <div
                key={iso}
                className={cn(
                  "pb-3 text-center",
                  isToday && "text-primary",
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wider">
                  {WEEKDAYS_SHORT[i]}
                </p>
                <p
                  className={cn(
                    "font-numeric text-sm",
                    isToday ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {format(d, "dd.MM.")}
                </p>
              </div>
            );
          })}

          {/* Time gutter */}
          <div className="relative" style={{ height: (HOURS.length - 1) * HOUR_PX }}>
            {HOURS.slice(0, -1).map((h, i) => (
              <div
                key={h}
                className="font-numeric absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: i * HOUR_PX }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const iso = format(d, "yyyy-MM-dd");
            const isToday = iso === todayISOStr;
            const dayCourses = weekCourses.filter(
              (c) => weekdayIndex(c.date) === di,
            );
            return (
              <div
                key={iso}
                className={cn(
                  "relative border-l border-hairline/60",
                  isToday && "bg-primary/[0.03]",
                )}
                style={{ height: (HOURS.length - 1) * HOUR_PX }}
              >
                {/* hour grid lines */}
                {HOURS.slice(0, -1).map((h, i) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-hairline/40"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}

                {/* now line */}
                {isToday && showNowLine ? (
                  <div
                    className="absolute inset-x-0 z-20 h-px bg-primary"
                    style={{ top: nowTop }}
                  >
                    <span className="absolute -left-1 -top-1 size-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  </div>
                ) : null}

                {/* course blocks */}
                {dayCourses.map((c, idx) => {
                  const top =
                    ((toMinutes(c.start_time) - DAY_START_HOUR * 60) /
                      TOTAL_MIN) *
                    (HOURS.length - 1) *
                    HOUR_PX;
                  const height = Math.max(
                    28,
                    ((toMinutes(c.end_time) - toMinutes(c.start_time)) /
                      TOTAL_MIN) *
                      (HOURS.length - 1) *
                      HOUR_PX -
                      2,
                  );
                  const m = STATUS_META[c.status];
                  const cancelled = c.status === "abgesagt";
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      className={cn(
                        "group absolute inset-x-1 z-10 overflow-visible rounded-md border p-1.5",
                        m.border,
                        m.bg,
                      )}
                      style={{ top, height }}
                    >
                      <div className="flex items-center gap-1">
                        <span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} />
                        <span className="font-numeric whitespace-nowrap text-[10px] text-body">
                          {timeRange(c.start_time, c.end_time)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "truncate text-xs font-semibold text-ink-strong",
                          cancelled && "line-through",
                        )}
                      >
                        {c.name}
                      </p>
                      {height > 52 ? (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {cancelled
                            ? "Abgesagt"
                            : c.status === "vertreten"
                              ? `Vertretung: ${c.substitute_name ?? "—"}`
                              : (c.room_name ?? "")}
                        </p>
                      ) : null}

                      {/* Tooltip */}
                      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden w-52 -translate-x-1/2 rounded-md border border-hairline bg-popover p-3 text-xs shadow-xl group-hover:block">
                        <p className="mb-1 font-semibold text-ink-strong">
                          {c.name}
                        </p>
                        <p className="font-numeric text-muted-foreground">
                          {timeRange(c.start_time, c.end_time)}
                        </p>
                        {c.status === "vertreten" ? (
                          <p className="mt-1 text-body">
                            <span className="line-through text-muted-foreground">
                              {c.original_name ?? c.trainer_name ?? "—"}
                            </span>{" "}
                            →{" "}
                            <span className="font-medium">
                              {c.substitute_name ?? "—"}
                            </span>
                          </p>
                        ) : cancelled ? (
                          <p className="mt-1 text-[var(--color-status-abgesagt)]">
                            Abgesagt · {c.cancel_reason ?? "keine Vertretung verfügbar"}
                          </p>
                        ) : (
                          <p className="mt-1 text-body">
                            Trainer: {c.trainer_name ?? "—"}
                          </p>
                        )}
                        <p className="mt-1 text-muted-foreground">
                          {c.room_name ?? "—"}
                          {c.location_name ? ` · ${c.location_name}` : ""}
                        </p>
                        <p className="font-numeric text-muted-foreground">
                          max. {c.max_participants} Teilnehmer
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["regulaer", "vertreten", "abgesagt"] as CourseStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
