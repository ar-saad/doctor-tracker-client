import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PhasePlaceholder
      title="Dashboard"
      description="Totals, registration trend and patient distribution."
      phase="Phase 9"
    />
  );
}
