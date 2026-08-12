"use client";

import type { LegendPayload, TooltipContentProps } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The chrome every dashboard chart shares: the card frame around it, the
 * tooltip, and the legend.
 *
 * Recharts styles itself with inline SVG attributes and a white default
 * tooltip, neither of which knows about the theme. Everything visual is
 * therefore funnelled through this module and expressed as the same CSS
 * variables the rest of the app uses — so dark mode, and any future change to
 * --chart-1..5, reaches the charts without touching a chart component.
 */

/** The five hues from globals.css. No hex literals anywhere in the charts. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Ticks are labels, not chart furniture: muted, small, no spine or tick marks. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
};

export const GRID_PROPS = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
};

/**
 * Every chart is 300px tall, including its empty and loading states, so the
 * dashboard's height is the same before and after the data lands.
 */
export const CHART_HEIGHT = 300;

export function ChartCard({
  title,
  description,
  isEmpty,
  emptyMessage = "No data to chart yet.",
  children,
  className,
}: {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {/* ResponsiveContainer measures its parent, so that parent must have a
          real width — w-full here, and nothing that shrink-wraps in between. */}
      <CardContent className="w-full">
        {isEmpty ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: CHART_HEIGHT }}
          >
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Recharts hands the series colour over in different fields depending on the
 * chart: `color` for lines and areas, the datum's own `fill` for pie slices.
 */
function entryColor(entry: {
  color?: string;
  payload?: { fill?: string } | unknown;
}): string {
  if (entry.color) {
    return entry.color;
  }

  const fill = (entry.payload as { fill?: string } | undefined)?.fill;
  return fill ?? "var(--muted-foreground)";
}

/**
 * `active` and `payload` arrive from Recharts when it clones this element, so
 * every prop is optional at the call site.
 */
type ChartTooltipProps = Partial<TooltipContentProps> & {
  /** Turns the axis value into the tooltip's heading — the dates, mainly. */
  formatLabel?: (label: string) => string;
};

export function ChartTooltip({ active, payload, label, formatLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const heading =
    label === undefined || label === ""
      ? null
      : formatLabel
        ? formatLabel(String(label))
        : String(label);

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {heading ? (
        <p className="mb-1.5 font-medium text-popover-foreground">{heading}</p>
      ) : null}

      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entryColor(entry) }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-popover-foreground">
              {String(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  /** Shown after the label where the series is a single number (the donut). */
  value?: number;
}

/**
 * Plain HTML rather than an SVG legend: it wraps, it can sit beside the chart
 * on one breakpoint and below it on another, and its text scales with the rest
 * of the page.
 */
export function ChartLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value === undefined ? null : (
            <span className="font-medium tabular-nums">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The same legend, adapted to what Recharts passes its <Legend content>. */
export function ChartLegendContent({
  payload,
}: {
  payload?: ReadonlyArray<LegendPayload>;
}) {
  return (
    <ChartLegend
      className="justify-center pt-3"
      items={(payload ?? []).map((entry) => ({
        label: entry.value ?? "",
        color: entry.color ?? "var(--muted-foreground)",
      }))}
    />
  );
}
