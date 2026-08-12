"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable, type Column } from "@/components/DataTable";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { FilterBar, FilterSelect, toOptions } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { ActionButton, RowActions } from "@/components/RowActions";
import { SearchInput } from "@/components/SearchInput";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useListParams } from "@/hooks/useListParams";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Doctor, DoctorFilterOptions } from "@/types";

/**
 * The doctors list: search, filters, pagination, and create / edit / delete.
 *
 * A Client Component because everything it does is interactive — but note what
 * it does NOT own: page, search and every filter are read from the URL, so this
 * component holds only the three pieces of state a URL has no business
 * carrying (which modal is open, and on which row).
 */

/** Module-level so the array identity is stable across renders. */
const FILTER_KEYS = ["specialization", "hospital", "startDate", "endDate"] as const;

const PAGE_SIZE = 10;

export function DoctorsPageClient() {
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

  const { data, meta, loading, error, refetch } = useFetch<Doctor[]>("/doctors", {
    page,
    limit: PAGE_SIZE,
    search,
    specialization: filters.specialization,
    hospital: filters.hospital,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  /**
   * Dropdown options come from their own endpoint rather than being derived
   * from `data`: the list is one page of ten, so deriving them would offer only
   * the specializations that happen to be visible right now.
   */
  const filterOptions = useFetch<DoctorFilterOptions>("/doctors/meta/filters");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);

  const rows = data ?? [];

  /**
   * A create or edit can introduce a specialization or hospital that is not in
   * the dropdowns yet, so both queries are refreshed — not just the table.
   */
  function refetchAll() {
    refetch();
    filterOptions.refetch();
  }

  async function handleDelete(doctor: Doctor) {
    await api.del(`/doctors/${doctor._id}`);

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

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Name",
      render: (doctor) => (
        <Link
          href={`/doctors/${doctor._id}`}
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {doctor.name}
        </Link>
      ),
    },
    { key: "specialization", header: "Specialization" },
    { key: "hospital", header: "Hospital" },
    {
      key: "phone",
      header: "Phone",
      render: (doctor) => (
        <a href={`tel:${doctor.phone}`} className="hover:text-foreground">
          {doctor.phone}
        </a>
      ),
      className: "text-muted-foreground",
    },
    {
      key: "email",
      header: "Email",
      render: (doctor) => (
        <a href={`mailto:${doctor.email}`} className="hover:text-foreground">
          {doctor.email}
        </a>
      ),
      className: "text-muted-foreground",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (doctor) => formatDate(doctor.createdAt),
      className: "text-muted-foreground",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (doctor) => (
        <RowActions>
          <ActionButton
            label="View doctor"
            icon={Eye}
            href={`/doctors/${doctor._id}`}
          />
          <ActionButton
            label="Edit doctor"
            icon={Pencil}
            onClick={() => {
              setEditing(doctor);
              setFormOpen(true);
            }}
          />
          <ActionButton
            label="Delete doctor"
            icon={Trash2}
            destructive
            onClick={() => setDeleting(doctor)}
          />
        </RowActions>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Doctors</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter and manage the doctor directory.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Add doctor
        </Button>
      </div>

      <div className="space-y-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, specialization or hospital…"
          label="Search doctors"
          className="max-w-sm"
        />

        <FilterBar active={isFiltered} onClear={clearAll}>
          <FilterSelect
            label="Specialization"
            value={filters.specialization}
            onChange={(value) => setFilter("specialization", value)}
            options={toOptions(filterOptions.data?.specializations ?? [])}
            loading={filterOptions.loading}
          />
          <FilterSelect
            label="Hospital"
            value={filters.hospital}
            onChange={(value) => setFilter("hospital", value)}
            options={toOptions(filterOptions.data?.hospitals ?? [])}
            loading={filterOptions.loading}
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
        rowKey={(doctor) => doctor._id}
        loading={loading}
        error={error}
        skeletonRows={PAGE_SIZE}
        empty={
          <div className="space-y-2">
            <p className="font-medium text-foreground">No doctors found</p>
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
              <p>Add the first doctor to get started.</p>
            )}
          </div>
        }
      />

      <Pagination meta={meta} onChange={setPage} disabled={loading} />

      <DoctorFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        doctor={editing}
        onSaved={refetchAll}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete doctor"
        description={
          <>
            <strong className="font-medium text-foreground">
              {deleting?.name}
            </strong>{" "}
            will be permanently deleted, along with every patient registered
            under them. This cannot be undone.
          </>
        }
        confirmLabel="Delete doctor"
        successMessage="Doctor deleted"
        onConfirm={async () => {
          if (deleting) {
            await handleDelete(deleting);
          }
        }}
      />
    </div>
  );
}
