"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_PROPS,
  CHART_HEIGHT,
  ChartCard,
  ChartLegendContent,
  ChartTooltip,
  GRID_PROPS,
} from "@/components/dashboard/ChartParts";
import { formatDate, formatDayMonth } from "@/lib/format";
import type { RegistrationsByDate } from "@/types";

/**
 * Doctor and patient sign-ups over the trailing fortnight.
 *
 * The series is plugged straight in: the API already emits one entry per day,
 * zero-filled and in order, precisely so this component does not have to
 * reconstruct the missing days — a chart drawn from Mongo's raw output would
 * join a quiet day to its neighbours with a straight line and read as steady
 * traffic that never happened.
 */

/** Two areas overlap, so their fills fade out rather than hiding one another. */
function fadeId(series: string): string {
  return `registrations-fade-${series}`;
}

function Fade({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

export function RegistrationsChart({ data }: { data: RegistrationsByDate[] }) {
  return (
    <ChartCard
      title="Registrations (last 14 days)"
      description="New doctors and patients per day."
      isEmpty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <Fade id={fadeId("doctors")} color="var(--chart-1)" />
            <Fade id={fadeId("patients")} color="var(--chart-2)" />
          </defs>

          {/* Horizontal rules only: the vertical ones duplicate the tooltip's
              cursor and clutter 14 columns of dates. */}
          <CartesianGrid {...GRID_PROPS} vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            // 14 ticks do not fit a 375px screen; Recharts drops the ones that
            // would collide instead of overlapping them.
            minTickGap={24}
            {...AXIS_PROPS}
          />
          <YAxis width={32} allowDecimals={false} {...AXIS_PROPS} />

          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={<ChartTooltip formatLabel={formatDate} />}
          />
          <Legend content={<ChartLegendContent />} />

          <Area
            type="monotone"
            dataKey="doctors"
            name="Doctors"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill={`url(#${fadeId("doctors")})`}
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="patients"
            name="Patients"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fill={`url(#${fadeId("patients")})`}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
