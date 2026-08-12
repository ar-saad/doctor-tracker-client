"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, fromApiDate, toApiDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The createdAt range filter, shared by /doctors and /patients.
 *
 * Both bounds are set in ONE call to the parent: picking a range with two
 * separate onChange calls would push two URL updates and fire two fetches, the
 * first of them against a half-applied filter.
 *
 * The API takes plain "yyyy-MM-dd" dates and widens the end bound to that day's
 * last millisecond itself, so nothing here has to think about time zones beyond
 * naming the day the user clicked.
 */

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
  className?: string;
}

function triggerLabel(startDate: string, endDate: string, fallback: string): string {
  if (startDate && endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `Until ${formatDate(endDate)}`;
  }
  return fallback;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  label = "Registered",
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const selected: DateRange | undefined =
    startDate || endDate
      ? { from: fromApiDate(startDate), to: fromApiDate(endDate) }
      : undefined;

  const isSet = startDate !== "" || endDate !== "";

  function handleSelect(range: DateRange | undefined) {
    onChange({
      startDate: range?.from ? toApiDate(range.from) : "",
      endDate: range?.to ? toApiDate(range.to) : "",
    });

    // Close once the range is complete; a single click is the start of a range,
    // so the popover has to stay open for the second one.
    if (range?.from && range.to) {
      setOpen(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 justify-start font-normal",
              isSet ? "border-primary/50" : "text-muted-foreground",
            )}
          >
            <CalendarDays />
            {triggerLabel(startDate, endDate, label)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected?.from}
            captionLayout="dropdown"
            // Nothing in this data set is created in the future, so offering
            // those days would only ever produce an empty result set.
            disabled={{ after: new Date() }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {isSet ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear date range"
          onClick={() => onChange({ startDate: "", endDate: "" })}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
