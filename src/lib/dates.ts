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

export { addDays, format, parseISO };
