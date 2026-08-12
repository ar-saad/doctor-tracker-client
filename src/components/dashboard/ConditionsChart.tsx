"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  CHART_COLORS,
  CHART_HEIGHT,
  ChartCard,
  ChartLegend,
  ChartTooltip,
} from "@/components/dashboard/ChartParts";
import type { PatientsByCondition } from "@/types";

/**
 * How the patient population splits across conditions.
 *
 * A donut rather than a pie: the hole stops the eye trying to compare slice
 * areas, which people are bad at, and leaves the legend to carry the numbers.
 * The API caps the series at eight slices — past that a donut is just a legend
 * with decoration.
 */

const INNER_RADIUS = 62;
const OUTER_RADIUS = 100;

export function ConditionsChart({ data }: { data: PatientsByCondition[] }) {
  const color = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

  return (
    <ChartCard
      title="Patients by Condition"
      description="Share of patients per recorded condition."
      isEmpty={data.length === 0}
      emptyMessage="No patients are registered yet."
    >
      {/* Legend beside the donut once there is room for it, underneath before
          that — hence flex rather than Recharts' own <Legend>, which cannot
          change side at a breakpoint. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="w-full min-w-0 lg:flex-1">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="condition"
                innerRadius={INNER_RADIUS}
                outerRadius={OUTER_RADIUS}
                paddingAngle={2}
                // Matching the card colour, so the gap between slices reads as
                // a gap rather than as a thin extra ring.
                stroke="var(--card)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.condition} fill={color(index)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ChartLegend
          className="lg:w-40 lg:shrink-0 lg:flex-col lg:items-start lg:gap-2"
          items={data.map((entry, index) => ({
            label: entry.condition,
            color: color(index),
            value: entry.count,
          }))}
        />
      </div>
    </ChartCard>
  );
}
