"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * One generic table for every list in the app.
 *
 * DataTable<Doctor> and DataTable<Patient> are the same component; the `render`
 * callback of a Column<T> receives a fully typed row, so a doctor column cannot
 * reach for `patient.condition` and compile. That is the concrete answer to
 * "why TypeScript here" — the alternative is a table of `any` rows where every
 * cell accessor is a runtime gamble.
 *
 * Loading, empty and error states are handled inside the table body rather than
 * by each page, so the column headers stay on screen throughout and the layout
 * never collapses to a blank flash between fetches.
 */

export interface Column<T> {
  /** Also used as the React key, so it must be unique within `columns`. */
  key: string;
  header: string;
  /** Cell content. Without it the row's matching property is rendered as text. */
  render?: (row: T) => React.ReactNode;
  /** Extra classes for both the header cell and every body cell in the column. */
  className?: string;
}

interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  /** Stable identity per row — every row here has a Mongo _id. */
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  /** Shown when the fetch succeeded and returned nothing. */
  empty?: React.ReactNode;
  /** How many skeleton rows to draw while loading; match the page size. */
  skeletonRows?: number;
}

/** The fallback when a column declares no `render`. */
function defaultCell<T>(row: T, key: string): React.ReactNode {
  const value = (row as Record<string, unknown>)[key];

  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function MessageRow({
  columnCount,
  children,
}: {
  columnCount: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnCount} className="h-32 whitespace-normal p-6">
        {children}
      </TableCell>
    </TableRow>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  empty = "No results found.",
  skeletonRows = 5,
}: DataTableProps<T>) {
  /**
   * Keep the previous rows on screen while a refetch is in flight — paging or
   * typing in the search box would otherwise blank the table on every keystroke.
   * Skeletons are only for the first load, when there is nothing to keep.
   */
  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className="rounded-xl border">
      {/* ui/table already wraps itself in an overflow-x-auto container, which is
          what keeps a seven-column table usable on a phone. */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("px-4 py-2.5", column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {error ? (
            <MessageRow columnCount={columns.length}>
              <p className="text-center text-sm text-destructive">{error}</p>
            </MessageRow>
          ) : null}

          {showSkeleton
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : null}

          {showEmpty ? (
            <MessageRow columnCount={columns.length}>
              <div className="text-center text-sm text-muted-foreground">{empty}</div>
            </MessageRow>
          ) : null}

          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              /* A stale row set during a refetch is dimmed rather than removed,
                 so it is visibly "not current" without the layout jumping. */
              className={cn(loading && "opacity-60 transition-opacity")}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn("px-4 py-3", column.className)}
                >
                  {column.render ? column.render(row) : defaultCell(row, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
