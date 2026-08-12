import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetailClient } from "@/components/doctors/DoctorDetailClient";
import { PageSkeleton } from "@/components/PageSkeleton";

export const metadata: Metadata = {
  title: "Doctor",
};

/** params is a Promise in Next.js 16 — all request-time APIs are async now. */
export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DoctorDetailClient doctorId={id} />
    </Suspense>
  );
}
