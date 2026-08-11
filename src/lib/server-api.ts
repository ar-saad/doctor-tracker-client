import "server-only";

import { cookies } from "next/headers";
import type { ApiResponse, User } from "@/types";

/**
 * The Server Component half of the API client.
 *
 * A Server Component has no origin, so the relative "/api" trick in lib/api.ts
 * does not apply — it calls API_URL directly and forwards the incoming request's
 * cookie header by hand, because server-side fetch carries no browser cookie jar.
 *
 * "server-only" makes importing this from a Client Component a build error
 * rather than a runtime leak of API_URL into the bundle.
 */

const API_URL = process.env.API_URL;

async function serverFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();

  const response = await fetch(`${API_URL}/api${path}`, {
    headers: { cookie: cookieStore.toString() },
    // Auth state must never be served from a cached render.
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  return body?.success ? body.data : null;
}

/**
 * The topbar's user, resolved on the server so the shell renders with a name
 * already in it — no flash of an empty avatar on every full page load.
 * Returns null for an expired or missing cookie; the layout redirects.
 */
export async function getCurrentUser(): Promise<User | null> {
  const result = await serverFetch<{ user: User }>("/auth/me");
  return result?.user ?? null;
}
