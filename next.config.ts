import type { NextConfig } from "next";

/**
 * The rewrite below is the single config that makes an httpOnly session cookie
 * workable across two separately deployed repos.
 *
 * The browser only ever calls a relative /api/* on this origin; Next proxies it
 * to the Express API. So the Set-Cookie the API returns is FIRST-PARTY —
 * SameSite=Lax is enough, Safari's third-party cookie blocking never applies,
 * and the API needs no CORS configuration at all.
 *
 * API_URL has no NEXT_PUBLIC_ prefix on purpose: it is read here at server
 * start, so the backend URL is never shipped to the browser.
 */
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  // Fail at boot with a readable message rather than serving an app whose every
  // request 404s against `undefined/api/...`. Mirrors the backend's env check.
  throw new Error(
    "API_URL is not set. Copy .env.example to .env.local (or set it in the hosting dashboard).",
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
