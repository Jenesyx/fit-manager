"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "@/app/(auth)/actions";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  hiddenWeiter,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  hiddenWeiter?: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {hiddenWeiter ? (
        <input type="hidden" name="weiter" value={hiddenWeiter} />
      ) : null}

      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-2">
          <Label htmlFor={f.name} className="text-body">
            {f.label}
          </Label>
          <Input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            required
            className="h-11 bg-[var(--color-canvas-soft)]"
          />
        </div>
      ))}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p
          role="status"
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 font-semibold"
      >
        {isPending ? "Bitte warten…" : submitLabel}
      </Button>
    </form>
  );
}
