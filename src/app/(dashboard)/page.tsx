import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * A thin Server Component for the metadata; the view is client-side because
 * Recharts measures the DOM to size itself. Unlike the list pages this one
 * needs no Suspense boundary — it reads no search params, so nothing here opts
 * the route out of prerendering.
 */
export default function DashboardPage() {
  return <DashboardClient />;
}
