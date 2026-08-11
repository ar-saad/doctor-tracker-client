import type { ApiResponse, ApiResult } from "@/types";

/**
 * The browser's view of the API.
 *
 * Every path here is relative to this app's own origin — next.config.ts rewrites
 * /api/* through to the Express server. Nothing in this file (or anywhere else
 * in client code) knows the backend URL, and no token is ever read or stored:
 * the session lives in an httpOnly cookie the browser attaches by itself.
 *
 * Server Components cannot use this module — they have no origin to be relative
 * to. They use lib/server-api.ts instead.
 */

const BASE_PATH = "/api";

/** The one route allowed to answer 401 without meaning "your session expired". */
const LOGIN_PATH = "/auth/login";

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/** Carries the HTTP status so call sites can treat 409 (duplicate email) specially. */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

/**
 * Builds a query string, dropping undefined/null/empty values so that a cleared
 * filter disappears from the URL instead of being sent as `?specialization=`.
 * Used by every list page in Phases 7-8.
 */
export function buildQuery(params?: QueryParams): string {
  if (!params) {
    return "";
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function buildPath(path: string, params?: QueryParams): string {
  return `${path}${buildQuery(params)}`;
}

/**
 * A 401 on any route other than login means the cookie expired or was cleared,
 * and it can happen during any request on any page. Handling it here — once —
 * keeps every call site free of session bookkeeping. `replace` rather than
 * `href` so the back button does not return to a page that will bounce again.
 */
function handleExpiredSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  const from = window.location.pathname + window.location.search;
  window.location.replace(`/login?from=${encodeURIComponent(from)}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(`${BASE_PATH}${path}`, {
    // Same-origin requests send cookies anyway; stated explicitly so the
    // intent survives anyone later pointing this at another host.
    credentials: "include",
    // Never serve a stale doctor list out of the browser's http cache after a
    // create or delete.
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 401 && !path.startsWith(LOGIN_PATH)) {
    handleExpiredSession();
    throw new ApiRequestError("Your session has expired. Please log in again.", 401);
  }

  // A 502 from a sleeping Render instance, or any proxy error, answers with HTML
  // rather than our envelope — so parsing is allowed to fail without throwing a
  // SyntaxError at the user.
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !body?.success) {
    throw new ApiRequestError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
    );
  }

  return { data: body.data, meta: body.meta };
}

export const api = {
  get: <T>(path: string, params?: QueryParams) =>
    request<T>(buildPath(path, params)),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Narrows an unknown catch value to something safe to show a user. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
