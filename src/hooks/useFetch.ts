"use client";

import { useCallback, useEffect, useState } from "react";
import { api, buildPath, errorMessage, type QueryParams } from "@/lib/api";
import type { PaginationMeta } from "@/types";

/**
 * The list pages' data layer: loading / error / data / meta / refetch.
 *
 * Deliberately not TanStack Query — one day of work, and every line of this is
 * explainable in an interview. If the app grew a cache, background refetching
 * or optimistic updates, that trade would flip.
 */

export interface UseFetchResult<T> {
  data: T | null;
  meta: PaginationMeta | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  meta?: PaginationMeta;
  error: string | null;
}

/**
 * `params` is serialised into the path and the PATH is the effect dependency —
 * a caller passing an inline `{ page, search }` object would otherwise create a
 * new object identity on every render and loop forever.
 *
 * Pass `path: null` to skip fetching (a dependent query whose input is not ready).
 */
export function useFetch<T>(
  path: string | null,
  params?: QueryParams,
): UseFetchResult<T> {
  const url = path === null ? null : buildPath(path, params);

  const [reloadKey, setReloadKey] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  /** Identifies one request. Bumping reloadKey re-requests the same URL. */
  const requestKey = url === null ? null : `${reloadKey}#${url}`;

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (url === null || requestKey === null) {
      return;
    }

    // Typing in the search box fires overlapping requests; without this guard a
    // slow early response can land after a fast later one and put stale rows on
    // screen. The flag also stops a setState after unmount.
    let active = true;

    api
      .get<T>(url)
      .then((result) => {
        if (!active) return;
        setSettled({
          key: requestKey,
          data: result.data,
          meta: result.meta,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setSettled({ key: requestKey, data: null, error: errorMessage(cause) });
      });

    return () => {
      active = false;
    };
  }, [url, requestKey]);

  // `loading` is DERIVED — "the settled result is not the one I am asking for".
  // Setting it from inside the effect instead would be a synchronous setState in
  // an effect body: an extra render pass, and a React Compiler lint error.
  const current = settled?.key === requestKey ? settled : null;

  return {
    data: current?.data ?? null,
    meta: current?.meta,
    loading: requestKey !== null && current === null,
    error: current?.error ?? null,
    refetch,
  };
}
