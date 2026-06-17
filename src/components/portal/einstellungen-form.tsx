"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type ActionState } from "@/app/portal/actions";

export function EinstellungenForm({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const res = await updateProfileAction(prev, fd);
      if (res.message) router.refresh();
      return res;
    },
    {},
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Vollständiger Name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Speichern…" : "Speichern"}
      </Button>
    </form>
  );
}
