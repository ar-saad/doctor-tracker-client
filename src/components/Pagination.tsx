"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types";

/**
 * Page controls driven by the `meta` block every list endpoint returns.
 *
 * Renders nothing at all when there is only one page — a lone disabled
 * "Previous / 1 of 1 / Next" is noise on a table of three doctors.
 */

interface PaginationProps {
  meta: PaginationMeta | undefined;
  onChange: (page: number) => void;
  /** Disables the buttons mid-flight so a fast double click cannot skip a page. */
  disabled?: boolean;
}

/** "Showing 11–20 of 57" — the last page is short, so clamp the upper bound. */
function rangeLabel({ page, limit, total }: PaginationMeta): string {
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  return `Showing ${first}–${last} of ${total}`;
}

export function Pagination({ meta, onChange, disabled = false }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  const { page, totalPages } = meta;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rangeLabel(meta)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft />
          Previous
        </Button>

        <span className="px-1 text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{page}</span> of{" "}
          {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
