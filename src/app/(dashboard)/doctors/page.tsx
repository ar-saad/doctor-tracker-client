import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorsPageClient } from "@/components/doctors/DoctorsPageClient";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "Doctors",
};

/**
 * A thin Server Component: metadata and the Suspense boundary useSearchParams
 * needs. All the behaviour is in DoctorsPageClient.
 */
export default function DoctorsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={10} />}>
      <DoctorsPageClient />
    </Suspense>
  );
}
