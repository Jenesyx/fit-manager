import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/constants";
import type { CourseStatus } from "@/lib/database.types";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-strong">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: CourseStatus;
  className?: string;
}) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        m.text,
        m.border,
        m.bg,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-hairline p-5",
        accent && "border-primary/40",
      )}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-numeric mt-2 text-3xl font-medium tabular-nums",
          accent ? "text-primary" : "text-ink-strong",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="card-hairline placeholder-striped flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="font-medium text-body">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
