import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection. (Next.js 16 renamed `middleware.ts` to `proxy.ts`; same API,
 * same position beside app/, the exported function is just called `proxy` now.)
 *
 * HONEST SCOPE: this checks that the cookie is PRESENT, not that its signature
 * is valid — the JWT secret lives on the API, not in this app. Real
 * authorization is enforced by the Express API on every single request; a forged
 * cookie gets you a redirect-free page whose every fetch then 401s. This is a UX
 * layer that keeps logged-out users off dashboard URLs, not a security boundary.
 */

const TOKEN_COOKIE = "token";
const LOGIN_PATH = "/login";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_COOKIE);
  const isLoginPage = pathname === LOGIN_PATH;

  if (!hasToken && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    // Remember where they were headed so login can send them back there.
    url.searchParams.set("from", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - api        the rewrite proxy to the Express server. THIS ONE MATTERS:
     *               proxy runs BEFORE next.config rewrites, so without the
     *               exclusion the cookie-less POST /api/auth/login would be
     *               redirected to /login and nobody could ever authenticate.
     *  - _next/*    build output and the image optimizer
     *  - favicon.ico and any other file with an extension in /public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
