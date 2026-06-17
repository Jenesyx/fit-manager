"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/constants";
import { updateUserRoleAction } from "@/app/portal/actions";
import type { UserRole } from "@/lib/database.types";

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  role: UserRole;
  can_create_courses: boolean;
};

export function TrainerManager({
  profiles,
  currentUserId,
}: {
  profiles: Row[];
  currentUserId: string;
}) {
  return (
    <div className="card-hairline overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">E-Mail</th>
            <th className="px-5 py-3 font-medium">Rolle</th>
            <th className="px-5 py-3 font-medium">Kursrechte</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <TrainerRow
              key={p.id}
              row={p}
              isSelf={p.id === currentUserId}
            />
          ))}
          {profiles.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-5 py-8 text-center text-muted-foreground"
              >
                Noch keine Nutzer.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function TrainerRow({ row, isSelf }: { row: Row; isSelf: boolean }) {
  const [role, setRole] = useState<UserRole>(row.role);
  const [canCreate, setCanCreate] = useState(row.can_create_courses);

  return (
    <tr className="border-b border-hairline/50 last:border-0">
      <td className="px-5 py-3 font-medium text-ink-strong">
        {row.full_name || "—"}
        {isSelf ? (
          <span className="ml-2 text-xs text-muted-foreground">(du)</span>
        ) : null}
      </td>
      <td className="px-5 py-3 text-muted-foreground">{row.email ?? "—"}</td>
      <td className="px-5 py-3">
        <form action={updateUserRoleAction} className="flex items-center gap-3">
          <input type="hidden" name="user_id" value={row.id} />
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSelf}
            className="h-9 rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          >
            {(["kunde", "trainer", "admin"] as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          {/* keep these in the same form */}
          <label
            className={`flex items-center gap-1.5 text-xs ${
              role === "trainer" ? "" : "invisible"
            }`}
          >
            <input
              type="checkbox"
              name="can_create_courses"
              checked={canCreate}
              onChange={(e) => setCanCreate(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            darf Kurse erstellen
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={isSelf}>
            Speichern
          </Button>
        </form>
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {row.role === "admin"
          ? "Ja (Admin)"
          : row.can_create_courses
            ? "Ja"
            : "Nein"}
      </td>
      <td />
    </tr>
  );
}
