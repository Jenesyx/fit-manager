import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { ROLE_LABEL } from "@/lib/constants";
import type { Profile } from "@/lib/auth";

export function Topbar({ profile }: { profile: Profile }) {
  const firstName = profile.full_name?.split(" ")[0] || "willkommen";

  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline px-6">
      <div className="flex flex-col">
        <p className="text-sm text-muted-foreground">Hallo,</p>
        <p className="-mt-0.5 font-semibold text-ink-strong">{firstName}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-xs font-medium text-body">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
          {ROLE_LABEL[profile.role]}
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-ink-strong"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </form>
      </div>
    </header>
  );
}
