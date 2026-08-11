import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";

export const metadata: Metadata = {
  title: "Patients",
};

export default function PatientsPage() {
  return (
    <PhasePlaceholder
      title="Patients"
      description="Every patient across all doctors, with filters and inline editing."
      phase="Phase 8"
    />
  );
}
