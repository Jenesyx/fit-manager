import { Clock, MapPin, Users, ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/portal/ui";
import { timeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { EnrichedCourse } from "@/lib/queries";

export function CourseCard({ course }: { course: EnrichedCourse }) {
  const cancelled = course.status === "abgesagt";

  return (
    <div
      className={cn(
        "card-hairline flex flex-col gap-3 p-5 transition-colors hover:border-hairline/80",
        cancelled && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "text-base font-semibold text-ink-strong",
            cancelled && "line-through decoration-[var(--color-status-abgesagt)]/60",
          )}
        >
          {course.name}
        </h3>
        <StatusPill status={course.status} />
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
          max. {course.max_participants}
        </span>
      </div>

      {/* Trainer line — shows substitution / cancellation context */}
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
    </div>
  );
}
