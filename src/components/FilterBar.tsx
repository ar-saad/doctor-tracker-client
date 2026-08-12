"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A slot-based filter row: the bar itself only handles layout, wrapping and the
 * "Clear" affordance. Which controls go in it is the page's business, which is
 * why /doctors (specialization + hospital) and /patients (condition + doctor)
 * can share it without either shape leaking into the other.
 */

interface FilterBarProps {
  children: React.ReactNode;
  /** Show the Clear button — the page knows whether anything is actually set. */
  active: boolean;
  onClear: () => void;
  className?: string;
}

export function FilterBar({ children, active, onClear, className }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filters"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {children}

      {active ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
          <X />
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export interface FilterOption {
  /** What goes in the URL. */
  value: string;
  /** What the user reads. */
  label: string;
}

/**
 * Most filters are distinct strings from /meta/filters, where the value and the
 * label are the same word. The doctor filter on /patients is the exception —
 * an id in the URL, a name on screen — which is why options are pairs.
 */
export function toOptions(values: readonly string[]): FilterOption[] {
  return values.map((value) => ({ value, label: value }));
}

interface FilterSelectProps {
  /** The visible placeholder AND the accessible name, e.g. "Specialization". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  loading?: boolean;
  className?: string;
}

/**
 * "" means unfiltered everywhere else in the app, but Radix reserves the empty
 * string as an item value (it uses it to mean "nothing selected"), so the
 * "All …" row carries a sentinel that is translated at this boundary and never
 * escapes into the URL.
 */
const ALL = "__all__";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  loading = false,
  className,
}: FilterSelectProps) {
  if (loading) {
    return <Skeleton className={cn("h-9 w-40 rounded-lg", className)} />;
  }

  return (
    <Select
      value={value === "" ? ALL : value}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 w-full sm:w-44",
          // A set filter reads as active at a glance, next to its neighbours.
          value !== "" && "border-primary/50 text-foreground",
          className,
        )}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
