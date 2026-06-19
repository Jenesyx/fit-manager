"use client";

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="de" className={`dark ${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          500
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Unerwarteter Fehler
        </h1>
        <p className="mt-4 max-w-sm text-base text-muted-foreground">
          Ein Fehler ist aufgetreten. Unsere Admins wurden automatisch
          benachrichtigt.
          {error.digest && (
            <span className="mt-1 block font-mono text-xs opacity-50">
              #{error.digest}
            </span>
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Erneut versuchen
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Startseite
          </a>
        </div>
      </body>
    </html>
  );
}
