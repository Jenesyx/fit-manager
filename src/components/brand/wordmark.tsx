import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Text wordmark for Fit-Manager. The design brief forbids an image logo;
 * brand is a small green glyph + "Fit·Manager" set in Inter.
 */
export function Wordmark({
  className,
  href = "/",
  asLink = true,
}: {
  className?: string;
  href?: string;
  asLink?: boolean;
}) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span
        aria-hidden
        className="size-5 rounded-[5px] bg-primary shadow-[0_0_12px_var(--color-primary)]"
      />
      <span className="text-base tracking-tight text-ink-strong">
        Fit<span className="text-primary">·</span>Manager
      </span>
    </span>
  );

  if (!asLink) return inner;
  return (
    <Link href={href} aria-label="Fit-Manager Startseite">
      {inner}
    </Link>
  );
}
