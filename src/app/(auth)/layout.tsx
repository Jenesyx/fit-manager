import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Reveal } from "@/components/motion/reveal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Ambient green glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] size-[640px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]"
      />
      <div className="absolute left-6 top-6">
        <Wordmark />
      </div>

      <Reveal className="relative z-10 w-full max-w-[420px]">
        <div className="card-hairline glow-primary p-8 sm:p-10">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            ← Zurück zur Startseite
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
