import { Activity, CalendarPlus, Stethoscope, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCount } from "@/lib/format";
import type { AnalyticsSummary } from "@/types";

/**
 * The four headline figures. Two are counted by the API; the other two are
 * derived here, because they are presentation of the same payload rather than
 * new information — asking the backend for an average it can compute from two
 * fields it already sent would be another round trip for nothing.
 */

/** The trend series is 14 days; "this week" is its second half. */
const WEEK_DAYS = 7;

interface Stat {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
}

/** Guarded: an empty database would otherwise put "NaN" on the dashboard. */
function averagePatientsPerDoctor(summary: AnalyticsSummary): string {
  if (summary.totalDoctors === 0) {
    return "0.0";
  }

  return (summary.totalPatients / summary.totalDoctors).toFixed(1);
}

function newPatientsThisWeek(summary: AnalyticsSummary): number {
  return summary.registrationsByDate
    .slice(-WEEK_DAYS)
    .reduce((total, day) => total + day.patients, 0);
}

function StatCard({ label, value, hint, icon: Icon }: Stat) {
  return (
    // h-full so all four match height whatever their text wraps to.
    <Card className="h-full">
      <CardContent className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>

        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function StatCards({ summary }: { summary: AnalyticsSummary }) {
  const stats: Stat[] = [
    {
      label: "Total Doctors",
      value: formatCount(summary.totalDoctors),
      hint: "in the directory",
      icon: Stethoscope,
    },
    {
      label: "Total Patients",
      value: formatCount(summary.totalPatients),
      hint: "across all doctors",
      icon: Users,
    },
    {
      label: "Avg Patients / Doctor",
      value: averagePatientsPerDoctor(summary),
      hint: "mean caseload",
      icon: Activity,
    },
    {
      label: "New This Week",
      value: formatCount(newPatientsThisWeek(summary)),
      hint: "patients, last 7 days",
      icon: CalendarPlus,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
