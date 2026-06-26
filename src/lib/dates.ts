import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  parseISO,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { PLANNING_HORIZON_DAYS } from "@/lib/constants";

/** Today as a YYYY-MM-DD string (local). */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Last plannable day (inclusive) as YYYY-MM-DD. */
export function horizonEndISO(): string {
  return format(addDays(new Date(), PLANNING_HORIZON_DAYS - 1), "yyyy-MM-dd");
}

/** True if an ISO date sits within [today, today + horizon). */
export function isWithinHorizon(dateISO: string): boolean {
  const diff = differenceInCalendarDays(parseISO(dateISO), new Date());
  return diff >= 0 && diff < PLANNING_HORIZON_DAYS;
}

/** Monday of the week containing `date`. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** "KW 21 · 19.–25. Mai 2026" header label for a Monday. */
export function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const kw = getISOWeek(monday);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const left = sameMonth
    ? format(monday, "d.", { locale: de })
    : format(monday, "d. MMM", { locale: de });
  const right = format(sunday, "d. MMM yyyy", { locale: de });
  return `KW ${kw} · ${left}–${right}`;
}

/** "Mo, 19. Mai" */
export function formatDayLong(dateISO: string): string {
  return format(parseISO(dateISO), "EEEE, d. MMMM", { locale: de });
}

/** "Di, 20.05." */
export function formatDayShort(d: Date): string {
  return format(d, "EE, dd.MM.", { locale: de });
}

/** "08:00" from a "08:00:00" Postgres time. */
export function formatTime(t: string): string {
  return t.slice(0, 5);
}

/** "08:00–09:00" */
export function timeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** Last plannable day for admin series (4 weeks = 28 days). */
export function seriesHorizonEndISO(): string {
  return format(addDays(new Date(), 27), "yyyy-MM-dd");
}

/**
 * Returns sorted ISO date strings within [startISO, endISO] that fall on any
 * of the given weekday offsets (0 = Monday … 6 = Sunday), repeating every
 * intervalWeeks. The reference week is the ISO week containing startISO.
 */
export function generateSeriesDates(
  startISO: string,
  endISO: string,
  dowIndices: number[],
  intervalWeeks: number,
): string[] {
  if (!startISO || !endISO || !dowIndices.length || intervalWeeks < 1) return [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (end < start) return [];

  const refMonday = startOfWeek(start, { weekStartsOn: 1 });
  const dates: string[] = [];
  let cur = refMonday;
  let wi = 0;

  while (cur <= end) {
    if (wi % intervalWeeks === 0) {
      for (const dow of dowIndices) {
        const d = addDays(cur, dow);
        if (d >= start && d <= end) dates.push(format(d, "yyyy-MM-dd"));
      }
    }
    cur = addDays(cur, 7);
    wi++;
  }

  return dates.sort();
}

/** "HH:MM:SS" oder "HH:MM" → Minuten seit Mitternacht. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export { addDays, format, parseISO };
