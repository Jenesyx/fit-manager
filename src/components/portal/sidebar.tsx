"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarPlus,
  ClipboardList,
  HeartPulse,
  Users,
  Settings,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  show: (ctx: { role: UserRole; canManage: boolean }) => boolean;
};

const NAV: NavItem[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { href: "/portal/kurse", label: "Kurse", icon: CalendarRange, show: () => true },
  { href: "/portal/stundenplan", label: "Stundenplan", icon: CalendarRange, show: () => true },
  {
    href: "/portal/kurse/erstellen",
    label: "Kurs erstellen",
    icon: CalendarPlus,
    show: ({ canManage }) => canManage,
  },
  {
    href: "/portal/verwaltung",
    label: "Kursverwaltung",
    icon: ClipboardList,
    show: ({ role }) => role === "admin",
  },
  {
    href: "/portal/krankmeldung",
    label: "Krankmeldung",
    icon: HeartPulse,
    show: ({ role }) => role === "trainer" || role === "admin",
  },
  {
    href: "/portal/krankmeldung/alle",
    label: "Alle Krankmeldungen",
    icon: FileText,
    show: ({ role }) => role === "admin",
  },
  {
    href: "/portal/trainer",
    label: "Trainerverwaltung",
    icon: Users,
    show: ({ role }) => role === "admin",
  },
  { href: "/portal/einstellungen", label: "Einstellungen", icon: Settings, show: () => true },
];

export function Sidebar({
  role,
  canManage,
}: {
  role: UserRole;
  canManage: boolean;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.show({ role, canManage }));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Wordmark href="/portal/dashboard" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/portal/kurse" && pathname.startsWith(item.href)) ||
            (item.href === "/portal/kurse" && pathname === "/portal/kurse");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-ink-strong"
                  : "text-sidebar-foreground hover:text-ink-strong hover:bg-sidebar-accent",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md border border-primary/30 bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 size-4",
                  active && "text-primary",
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="font-numeric text-[11px] uppercase tracking-widest text-muted-foreground">
          Fit &amp; Aktiv
        </p>
      </div>
    </aside>
  );
}
