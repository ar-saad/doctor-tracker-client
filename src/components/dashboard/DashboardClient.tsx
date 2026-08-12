"use client";

import { ConditionsChart } from "@/components/dashboard/ConditionsChart";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PatientsPerDoctorChart } from "@/components/dashboard/PatientsPerDoctorChart";
import { RegistrationsChart } from "@/components/dashboard/RegistrationsChart";
import { StatCards } from "@/components/dashboard/StatCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFetch } from "@/hooks/useFetch";
import type { AnalyticsSummary } from "@/types";

/**
 * The landing page: four figures and three charts from a single request.
 *
 * /analytics/summary answers with every number on this page at once, so there
 * is one loading state for the whole view rather than seven independently
 * settling widgets — no cascade of things popping in, and no chance of the
 * stat cards disagreeing with the charts because they were counted a second
 * apart.
 */
export function DashboardClient() {
  const { data, loading, error } = useFetch<AnalyticsSummary>("/analytics/summary");

  return (
    <div className="space-y-6">
      {/* Outside the loading branch: it is static text, so rendering it
          immediately gives the page a title while the request is in flight. */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Totals, registration trend and patient distribution.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <DashboardSkeleton /> : null}

      {data ? (
        <div className="space-y-6">
          <StatCards summary={data} />

          <RegistrationsChart data={data.registrationsByDate} />

          <div className="grid gap-4 xl:grid-cols-2">
            <PatientsPerDoctorChart data={data.patientsPerDoctor} />
            <ConditionsChart data={data.patientsByCondition} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
