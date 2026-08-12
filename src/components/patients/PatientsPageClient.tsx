"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, type Column } from "@/components/DataTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import {
  FilterBar,
  FilterSelect,
  toOptions,
  type FilterOption,
} from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { ActionButton, RowActions } from "@/components/RowActions";
import { SearchInput } from "@/components/SearchInput";
import { ConditionBadge } from "@/components/patients/ConditionBadge";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { useFetch } from "@/hooks/useFetch";
import { useListParams } from "@/hooks/useListParams";
import { api } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import type { Doctor, Patient, PatientFilterOptions } from "@/types";

/**
 * Every patient, across all doctors.
 *
 * Structurally the doctors list with a different column set — same URL-as-state
 * hook, same table, same pagination — which is the payoff for Phase 7 having
 * built those as components rather than as one page. The two differences worth
 * knowing about are in the filters (one of them is an id, not a word) and in
 * what is missing: there is no "Add patient" button here, because a patient
 * cannot exist without a doctor. Creation lives on a doctor's page, where the
 * doctor is unambiguous; this page can still MOVE a patient between doctors,
 * which is an edit, not a creation.
 */

/** Module-level so the array identity is stable across renders. */
const FILTER_KEYS = ["condition", "doctorId", "startDate", "endDate"] as const;

const PAGE_SIZE = 10;

/** The API caps `limit` at 50, and a select is the wrong control past that anyway. */
const DOCTOR_OPTIONS_LIMIT = 50;

export function PatientsPageClient() {
  const {
    page,
    search,
    filters,
    setPage,
    setSearch,
    setFilter,
    setFilters,
    clearAll,
    isFiltered,
  } = useListParams(FILTER_KEYS);

  const { data, meta, loading, error, refetch } = useFetch<Patient[]>("/patients", {
    page,
    limit: PAGE_SIZE,
    search,
    condition: filters.condition,
    doctorId: filters.doctorId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  /** Distinct conditions across the whole collection, not just this page. */
  const filterOptions = useFetch<PatientFilterOptions>("/patients/meta/filters");

  /**
   * One doctors query serves two controls: the filter and the edit form's
   * reassignment picker. Only _id and name are used, but the list endpoint has
   * no field projection and 50 doctors is a few kilobytes — a query parameter
   * the API does not support yet would be the wrong thing to invent here.
   */
  const doctorsQuery = useFetch<Doctor[]>("/doctors", { limit: DOCTOR_OPTIONS_LIMIT });

  /**
   * Open-ness is its own flag rather than `editing !== null`, so clearing the
   * row does not blank the dialog's contents halfway through its close
   * animation. Same pairing as the doctors page.
   */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const rows = data ?? [];

  const doctorOptions = useMemo<FilterOption[]>(
    () =>
      (doctorsQuery.data ?? []).map((doctor) => ({
        value: doctor._id,
        label: doctor.name,
      })),
    [doctorsQuery.data],
  );

  /**
   * The list is capped at 50, so the patient being edited may belong to a doctor
   * who is not in it. Their populated doctor is prepended in that case, so the
   * picker always opens showing the doctor the patient actually has instead of
   * an empty trigger that would silently reassign them on save.
   */
  const editDoctorOptions = useMemo<FilterOption[]>(() => {
    if (!editing || doctorOptions.some((o) => o.value === editing.doctor._id)) {
      return doctorOptions;
    }

    return [
      { value: editing.doctor._id, label: editing.doctor.name },
      ...doctorOptions,
    ];
  }, [editing, doctorOptions]);

  /** An edit can introduce — or retire — a condition, so both queries refresh. */
  function refetchAll() {
    refetch();
    filterOptions.refetch();
  }

  async function handleDelete(patient: Patient) {
    await api.del(`/patients/${patient._id}`);

    // Deleting the only row on page 3 would otherwise leave the table empty on
    // a page that no longer exists. Stepping back changes the URL, which
    // refetches by itself — calling refetch() as well would fire twice.
    if (rows.length === 1 && page > 1) {
      setPage(page - 1);
      filterOptions.refetch();
      return;
    }

    refetchAll();
  }

  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "Name",
      render: (patient) => (
        <span className="font-medium text-foreground">{patient.name}</span>
      ),
    },
    { key: "age", header: "Age" },
    {
      key: "gender",
      header: "Gender",
      render: (patient) => titleCase(patient.gender),
    },
    {
      key: "phone",
      header: "Phone",
      render: (patient) => (
        <a href={`tel:${patient.phone}`} className="hover:text-foreground">
          {patient.phone}
        </a>
      ),
      className: "text-muted-foreground",
    },
    {
      key: "condition",
      header: "Condition",
      render: (patient) => <ConditionBadge condition={patient.condition} />,
    },
    {
      key: "doctor",
      header: "Doctor",
      // The doctor is populated by the API, so the name is already here — and
      // linking it makes the reassignment above verifiable in one click.
      render: (patient) => (
        <Link
          href={`/doctors/${patient.doctor._id}`}
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          {patient.doctor.name}
        </Link>
      ),
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
            label="Edit patient"
            icon={Pencil}
            onClick={() => {
              setEditing(patient);
              setEditOpen(true);
            }}
          />
          <ActionButton
            label="Delete patient"
            icon={Trash2}
            destructive
            onClick={() => setDeleting(patient)}
          />
        </RowActions>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Every patient on record. Add new ones from their doctor&apos;s page.
        </p>
      </div>

      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or phone…"
          label="Search patients"
          className="max-w-sm"
        />

        <FilterBar active={isFiltered} onClear={clearAll}>
          <FilterSelect
            label="Condition"
            value={filters.condition}
            onChange={(value) => setFilter("condition", value)}
            options={toOptions(filterOptions.data?.conditions ?? [])}
            loading={filterOptions.loading}
          />
          <FilterSelect
            label="Doctor"
            value={filters.doctorId}
            onChange={(value) => setFilter("doctorId", value)}
            // Value and label differ here: the URL carries the doctor's id, the
            // dropdown shows their name.
            options={doctorOptions}
            loading={doctorsQuery.loading}
          />
          <DateRangeFilter
            startDate={filters.startDate}
            endDate={filters.endDate}
            // Both bounds in one update: two calls would mean two URL writes
            // and a fetch against a half-applied range.
            onChange={setFilters}
          />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(patient) => patient._id}
        loading={loading}
        error={error}
        skeletonRows={PAGE_SIZE}
        empty={
          <div className="space-y-2">
            <p className="font-medium text-foreground">No patients found</p>
            {isFiltered ? (
              <p>
                No one matches the current search and filters.{" "}
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Clear them
                </button>{" "}
                to see everyone.
              </p>
            ) : (
              <p>
                Patients are registered under a doctor — open one from{" "}
                <Link
                  href="/doctors"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Doctors
                </Link>{" "}
                to add the first.
              </p>
            )}
          </div>
        }
      />

      <Pagination meta={meta} onChange={setPage} disabled={loading} />

      <PatientFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        patient={editing}
        doctorId={editing?.doctor._id}
        doctorOptions={editDoctorOptions}
        onSaved={refetchAll}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete patient"
        description={
          <>
            <strong className="font-medium text-foreground">
              {deleting?.name}
            </strong>{" "}
            will be permanently deleted from{" "}
            {deleting?.doctor.name ?? "their doctor"}&apos;s list. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete patient"
        successMessage="Patient deleted"
        onConfirm={async () => {
          if (deleting) {
            await handleDelete(deleting);
          }
        }}
      />
    </div>
  );
}
