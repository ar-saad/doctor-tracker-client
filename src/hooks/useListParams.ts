"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * List state (page + search + filters) lives in the URL, not in useState.
 *
 * Three things fall out of that for free: the URL is shareable, the browser's
 * back button steps through filter changes, and a hard refresh restores exactly
 * what was on screen. The alternative — component state — loses all three and
 * is no simpler to write.
 *
 * router.replace rather than push: typing in a debounced search box would
 * otherwise push a history entry per keystroke and make Back unusable.
 */

/** Page 1 is the default, so it is omitted from the URL rather than written as ?page=1. */
const FIRST_PAGE = 1;

/** Null or "" clears the param; a value sets it. */
type ParamUpdates = Record<string, string | number | null | undefined>;

export interface ListParams<K extends string> {
  page: number;
  search: string;
  /** One entry per key passed in `filterKeys`; absent params read as "". */
  filters: Record<K, string>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilter: (key: K, value: string) => void;
  /** Several filters at once (the date range sets both bounds in one go). */
  setFilters: (updates: Partial<Record<K, string>>) => void;
  clearAll: () => void;
  /** True when anything other than the page number is set — drives "Clear". */
  isFiltered: boolean;
}

export interface ListParamsOptions {
  /**
   * The param the page number is stored under. The doctor detail page paginates
   * its patient table with "patientPage" so it cannot collide with a page
   * number belonging to some other table on the same URL.
   */
  pageKey?: string;
  searchKey?: string;
}

export function useListParams<K extends string = never>(
  filterKeys: readonly K[] = [],
  { pageKey = "page", searchKey = "search" }: ListParamsOptions = {},
): ListParams<K> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** The identity of searchParams changes on every navigation; its string form
   *  is what actually matters, so memo keys hang off that instead. */
  const paramsKey = searchParams.toString();

  const page = Math.max(FIRST_PAGE, Number(searchParams.get(pageKey)) || FIRST_PAGE);
  const search = searchParams.get(searchKey) ?? "";

  const filters = useMemo(() => {
    const current = new URLSearchParams(paramsKey);
    const entries = filterKeys.map((key) => [key, current.get(key) ?? ""]);
    return Object.fromEntries(entries) as Record<K, string>;
    // filterKeys is a module-level constant at every call site, but spreading it
    // into the dependency list keeps that from being an unchecked assumption.
  }, [paramsKey, filterKeys]);

  const isFiltered = useMemo(
    () => search !== "" || filterKeys.some((key) => filters[key] !== ""),
    [search, filters, filterKeys],
  );

  /**
   * The one place the URL is written. `resetPage` defaults to true because every
   * caller except setPage itself needs it: narrowing a filter while sitting on
   * page 4 of the old result set is the classic "why is my table empty" bug.
   */
  const apply = useCallback(
    (updates: ParamUpdates, resetPage = true) => {
      const next = new URLSearchParams(paramsKey);

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (resetPage) {
        next.delete(pageKey);
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [paramsKey, pageKey, pathname, router],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      apply({ [pageKey]: nextPage <= FIRST_PAGE ? null : nextPage }, false);
    },
    [apply, pageKey],
  );

  const setSearch = useCallback(
    (value: string) => apply({ [searchKey]: value }),
    [apply, searchKey],
  );

  const setFilter = useCallback(
    (key: K, value: string) => apply({ [key]: value }),
    [apply],
  );

  const setFilters = useCallback(
    (updates: Partial<Record<K, string>>) => apply(updates),
    [apply],
  );

  /** Clears search and every filter but leaves unrelated params on the URL alone. */
  const clearAll = useCallback(() => {
    const cleared: ParamUpdates = { [searchKey]: null };
    for (const key of filterKeys) {
      cleared[key] = null;
    }
    apply(cleared);
  }, [apply, filterKeys, searchKey]);

  return {
    page,
    search,
    filters,
    setPage,
    setSearch,
    setFilter,
    setFilters,
    clearAll,
    isFiltered,
  };
}
