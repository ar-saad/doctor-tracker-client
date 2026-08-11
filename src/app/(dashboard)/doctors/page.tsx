import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";

export const metadata: Metadata = {
  title: "Doctors",
};

export default function DoctorsPage() {
  return (
    <PhasePlaceholder
      title="Doctors"
      description="Search, filter and manage the doctor directory."
      phase="Phase 7"
    />
  );
}
