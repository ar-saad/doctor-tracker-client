import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/PhasePlaceholder";

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
    <PhasePlaceholder
      title="Doctor detail"
      description={`Profile and patient list for doctor ${id}.`}
      phase="Phase 7"
    />
  );
}
