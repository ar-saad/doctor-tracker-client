import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientsPageClient } from "@/components/patients/PatientsPageClient";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "Patients",
};

/**
 * A thin Server Component: metadata and the Suspense boundary useSearchParams
 * needs. All the behaviour is in PatientsPageClient.
 */
export default function PatientsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={10} />}>
      <PatientsPageClient />
    </Suspense>
  );
}
