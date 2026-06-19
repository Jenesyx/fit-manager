"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function PortalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-5 size-10 text-destructive" />

      <h2 className="text-xl font-bold tracking-tight text-ink-strong">
        Etwas ist schiefgelaufen
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Diese Seite konnte nicht geladen werden.
        {error.digest && (
          <span className="mt-1 block font-mono text-xs opacity-50">
            #{error.digest}
          </span>
        )}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RotateCcw className="size-4" />
          Erneut versuchen
        </button>
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
