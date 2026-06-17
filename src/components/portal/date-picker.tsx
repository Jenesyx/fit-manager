"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
  id,
  name,
  min,
  max,
  value,
  onChange,
}: {
  id?: string;
  name: string;
  min?: string;
  max?: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISO(value) : undefined;
  const minDate = min ? parseISO(min) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  const display =
    selected && isValid(selected)
      ? format(selected, "dd.MM.yyyy", { locale: de })
      : "TT.MM.JJJJ";

  return (
    <>
      <input type="hidden" id={id} name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-hairline bg-[var(--color-canvas-soft)] px-3 text-sm outline-none transition-colors hover:border-primary/60 focus-visible:border-primary",
            )}
          >
            <span
              className={cn(
                "font-numeric",
                value ? "text-body" : "text-muted-foreground",
              )}
            >
              {display}
            </span>
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={
              selected && isValid(selected) ? selected : minDate
            }
            disabled={(d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            }}
            locale={de}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
