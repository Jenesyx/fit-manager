"use client";

import { useState } from "react";
import {
  Clock,
  MapPin,
  Users,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/portal/ui";
import { timeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  registerForCourseAction,
  unregisterFromCourseAction,
} from "@/app/portal/actions";
import type { EnrichedCourse } from "@/lib/queries";
import type { UserRole } from "@/lib/database.types";

export function ExpandableCourseCard({
  course,
  isRegistered,
  role,
  registeredCount = 0,
}: {
  course: EnrichedCourse;
  isRegistered: boolean;
  role: UserRole;
  registeredCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cancelled = course.status === "abgesagt";
  const spotsLeft = Math.max(0, course.max_participants - registeredCount);
  const full = !cancelled && spotsLeft === 0;

  return (
    <div
      className={cn(
        "card-hairline flex flex-col transition-colors",
        cancelled && "opacity-80",
      )}
    >
      {/* Clickable summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-col gap-3 p-5 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-base font-semibold text-ink-strong",
              cancelled &&
                "line-through decoration-[var(--color-status-abgesagt)]/60",
            )}
          >
            {course.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill status={course.status} />
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-body">
          <span className="font-numeric inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            {timeRange(course.start_time, course.end_time)}
          </span>
          {course.room_name ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              {course.room_name}
              {course.location_name ? ` · ${course.location_name}` : ""}
            </span>
          ) : null}
          <span className="font-numeric inline-flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            {cancelled
              ? `max. ${course.max_participants}`
              : `${registeredCount}/${course.max_participants} belegt`}
          </span>
          {full ? (
            <span className="rounded-full bg-[var(--color-status-abgesagt)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-status-abgesagt)]">
              Ausgebucht
            </span>
          ) : null}
        </div>

        <div className="border-t border-hairline pt-3 text-sm">
          {course.status === "vertreten" ? (
            <p className="flex flex-wrap items-center gap-1.5 text-body">
              <span className="text-muted-foreground line-through">
                {course.original_name ?? course.trainer_name ?? "—"}
              </span>
              <ArrowRight className="size-3.5 text-[var(--color-status-vertreten)]" />
              <span className="font-medium text-ink-strong">
                {course.substitute_name ?? "Vertretung"}
              </span>
            </p>
          ) : cancelled ? (
            <p className="text-[var(--color-status-abgesagt)]">
              Kurs abgesagt · Grund: {course.cancel_reason ?? "—"}
            </p>
          ) : (
            <p className="text-body">
              Trainer:{" "}
              <span className="font-medium text-ink-strong">
                {course.trainer_name ?? "—"}
              </span>
            </p>
          )}
        </div>
      </button>

      {/* Expandable description */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-hairline px-5 pb-4 pt-3 text-sm text-body">
              {course.description ? (
                <p className="leading-relaxed">{course.description}</p>
              ) : (
                <p className="italic text-muted-foreground">
                  Keine Beschreibung vorhanden.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration button — always visible for Kunden */}
      {role === "kunde" && !cancelled ? (
        <div className="border-t border-hairline px-5 pb-4 pt-3">
          {isRegistered ? (
            <form action={unregisterFromCourseAction}>
              <input type="hidden" name="course_id" value={course.id} />
              <Button type="submit" variant="outline" className="w-full">
                Abmelden
              </Button>
            </form>
          ) : full ? (
            <Button type="button" disabled className="w-full">
              Ausgebucht
            </Button>
          ) : (
            <form action={registerForCourseAction}>
              <input type="hidden" name="course_id" value={course.id} />
              <Button type="submit" className="w-full">
                Anmelden · noch {spotsLeft}{" "}
                {spotsLeft === 1 ? "Platz" : "Plätze"}
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
