import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-sm text-body md:flex">
          <a href="#kurse" className="transition-colors hover:text-ink-strong">
            Kurse
          </a>
          <a href="#standorte" className="transition-colors hover:text-ink-strong">
            Standorte
          </a>
          <a href="#angebot" className="transition-colors hover:text-ink-strong">
            Angebot
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-body hover:text-ink-strong">
            <Link href="/anmelden">Anmelden</Link>
          </Button>
          <Button asChild className="font-semibold">
            <Link href="/registrieren">Mitglied werden</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
