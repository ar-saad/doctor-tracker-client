"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { ActionButton, RowActions } from "@/components/RowActions";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useListParams } from "@/hooks/useListParams";
import { api } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import type { Doctor, DoctorPatient } from "@/types";

/**
 * One doctor, plus the patients registered under them.
 *
 * Two independent queries rather than one: the profile card and the patient
 * table have different lifetimes — paging the table must not re-fetch or blank
 * the card, and editing the doctor must not disturb the table.
 */

const PAGE_SIZE = 10;

/**
 * The patient table's page is stored as ?patientPage= rather than ?page=. There
 * is only one table here today, but "page" is the doctors list's parameter and
 * reusing it would make a back-navigation from this page land the list on a
 * page it never chose.
 */
const PAGE_PARAM = { pageKey: "patientPage" };

/** Module-level for a stable identity; this page filters nothing. */
const NO_FILTERS = [] as const;

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <Skeleton className="h-7 w-52" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DoctorDetailClient({ doctorId }: { doctorId: string }) {
  const { page, setPage } = useListParams(NO_FILTERS, PAGE_PARAM);

  const doctorQuery = useFetch<Doctor>(`/doctors/${doctorId}`);
  const patientsQuery = useFetch<DoctorPatient[]>(`/doctors/${doctorId}/patients`, {
    page,
    limit: PAGE_SIZE,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [deleting, setDeleting] = useState<DoctorPatient | null>(null);

  const doctor = doctorQuery.data;
  const patients = patientsQuery.data ?? [];

  async function handleDeletePatient(patient: DoctorPatient) {
    // Scoped to this doctor's URL, so the API refuses an id that is not theirs.
    await api.del(`/doctors/${doctorId}/patients/${patient._id}`);

    if (patients.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }

    patientsQuery.refetch();
  }

  const columns: Column<DoctorPatient>[] = [
    {
      key: "name",
      header: "Name",
      render: (patient) => <span className="font-medium">{patient.name}</span>,
    },
    { key: "age", header: "Age" },
    {
      key: "gender",
      header: "Gender",
      render: (patient) => titleCase(patient.gender),
    },
    { key: "phone", header: "Phone", className: "text-muted-foreground" },
    {
      key: "condition",
      header: "Condition",
      render: (patient) => <Badge variant="secondary">{patient.condition}</Badge>,
    },
    {
      key: "createdAt",
      header: "Registered",
      render: (patient) => formatDate(patient.createdAt),
      className: "text-muted-foreground",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (patient) => (
        <RowActions>
          <ActionButton
            label="Remove patient"
            icon={Trash2}
            destructive
            onClick={() => setDeleting(patient)}
          />
        </RowActions>
      ),
    },
  ];

  /**
   * A bad id 404s. Rendering the patient table underneath an error about a
   * doctor who does not exist would be nonsense, so this is the whole page.
   */
  if (doctorQuery.error) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/doctors">
            <ArrowLeft />
            Back to doctors
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertTitle>Doctor not available</AlertTitle>
          <AlertDescription>{doctorQuery.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/doctors">
          <ArrowLeft />
          Back to doctors
        </Link>
      </Button>

      {doctor ? (
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {doctor.name}
                </h1>
                <Badge>
                  <Stethoscope />
                  {doctor.specialization}
                </Badge>
              </div>

              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoRow icon={Building2} label="Hospital">
                {doctor.hospital}
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                <a href={`tel:${doctor.phone}`} className="hover:underline">
                  {doctor.phone}
                </a>
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                <a href={`mailto:${doctor.email}`} className="hover:underline">
                  {doctor.email}
                </a>
              </InfoRow>
              <InfoRow icon={CalendarDays} label="Registered">
                {formatDate(doctor.createdAt)}
              </InfoRow>
            </dl>
          </CardContent>
        </Card>
      ) : (
        <DoctorCardSkeleton />
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Patients under this doctor
            </h2>
            <p className="text-sm text-muted-foreground">
              {patientsQuery.meta
                ? `${patientsQuery.meta.total} registered`
                : "Loading…"}
            </p>
          </div>

          <Button
            onClick={() => setAddPatientOpen(true)}
            // Nothing can be filed under a doctor who has not loaded yet.
            disabled={!doctor}
          >
            <Plus />
            Add patient
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={patients}
          rowKey={(patient) => patient._id}
          loading={patientsQuery.loading}
          error={patientsQuery.error}
          skeletonRows={5}
          empty={
            <div className="space-y-2">
              <p className="font-medium text-foreground">No patients yet</p>
              <p>Use “Add patient” to register the first one under this doctor.</p>
            </div>
          }
        />

        <Pagination
          meta={patientsQuery.meta}
          onChange={setPage}
          disabled={patientsQuery.loading}
        />
      </section>

      <DoctorFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        doctor={doctor}
        onSaved={doctorQuery.refetch}
      />

      <PatientFormModal
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
        doctorId={doctorId}
        onSaved={patientsQuery.refetch}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Remove patient"
        description={
          <>
            <strong className="font-medium text-foreground">
              {deleting?.name}
            </strong>{" "}
            will be permanently deleted. A patient record cannot exist without a
            doctor, so removing them from this list deletes them outright.
          </>
        }
        confirmLabel="Remove patient"
        successMessage="Patient removed"
        onConfirm={async () => {
          if (deleting) {
            await handleDeletePatient(deleting);
          }
        }}
      />
    </div>
  );
}
