"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_PROPS,
  CHART_HEIGHT,
  ChartCard,
  ChartTooltip,
  GRID_PROPS,
} from "@/components/dashboard/ChartParts";
import type { PatientsPerDoctor } from "@/types";

/**
 * The ten busiest doctors.
 *
 * Horizontal bars (layout="vertical") because the labels are people's names:
 * vertical bars would leave them rotated 45 degrees under the axis, and
 * "Dr. Priya Raghunathan" does not fit in a column 30px wide.
 */

/** Room for a name on the axis without eating the bars on a narrow screen. */
const LABEL_WIDTH = 116;

/** Names longer than this are cut on the axis; the tooltip shows them in full. */
const MAX_LABEL_CHARS = 16;

function truncate(name: string): string {
  return name.length > MAX_LABEL_CHARS
    ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…`
    : name;
}

export function PatientsPerDoctorChart({ data }: { data: PatientsPerDoctor[] }) {
  return (
    <ChartCard
      title="Patients per Doctor (top 10)"
      description="Doctors with the largest caseloads."
      isEmpty={data.length === 0}
      emptyMessage="No patients are registered yet."
    >
      {/* The API caps the series at ten, which fits the shared 300px height at
          ~29px a band — so this card is the same height as its neighbour, and
          the same height as the skeleton it replaces. */}
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
        >
          {/* Vertical rules only — they are the ones the bars run along. */}
          <CartesianGrid {...GRID_PROPS} horizontal={false} />

          <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
          <YAxis
            type="category"
            dataKey="doctorName"
            width={LABEL_WIDTH}
            tickFormatter={truncate}
            {...AXIS_PROPS}
          />

          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            // The heading is the category value, so a truncated axis label is
            // still readable in full on hover.
            content={<ChartTooltip />}
          />

          <Bar
            dataKey="count"
            name="Patients"
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
