import type { CourseStatus, UserRole } from "@/lib/database.types";

export const STATUS_META: Record<
  CourseStatus,
  { label: string; dot: string; text: string; border: string; bg: string }
> = {
  regulaer: {
    label: "Regulär",
    dot: "bg-[var(--color-status-regulaer)]",
    text: "text-[var(--color-status-regulaer)]",
    border: "border-[var(--color-status-regulaer)]/40",
    bg: "bg-[var(--color-status-regulaer)]/10",
  },
  vertreten: {
    label: "Vertreten",
    dot: "bg-[var(--color-status-vertreten)]",
    text: "text-[var(--color-status-vertreten)]",
    border: "border-[var(--color-status-vertreten)]/40",
    bg: "bg-[var(--color-status-vertreten)]/10",
  },
  abgesagt: {
    label: "Abgesagt",
    dot: "bg-[var(--color-status-abgesagt)]",
    text: "text-[var(--color-status-abgesagt)]",
    border: "border-[var(--color-status-abgesagt)]/40",
    bg: "bg-[var(--color-status-abgesagt)]/10",
  },
};

export const ROLE_LABEL: Record<UserRole, string> = {
  kunde: "Kunde",
  trainer: "Trainer",
  admin: "Admin",
};

/** German weekday names, Monday-first (matches Stundenplan). */
export const WEEKDAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

/** Stundenplan time range. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;

/** Planning horizon: courses only for the next two weeks (14 days). */
export const PLANNING_HORIZON_DAYS = 14;
