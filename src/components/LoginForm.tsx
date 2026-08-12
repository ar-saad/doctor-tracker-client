"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { User } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/**
 * Nothing here touches the token. POST /api/auth/login goes to this app's own
 * origin, Next rewrites it to the API, and the API's Set-Cookie lands as a
 * first-party httpOnly cookie the browser sends on every later request by
 * itself. The only client-side state is "did it work".
 */

/**
 * `from` comes from the URL, so it is attacker-controllable: without this check
 * /login?from=https://evil.example would turn a successful login into an open
 * redirect. Only same-site absolute paths are accepted ("//host" is a
 * protocol-relative URL, not a path).
 */
function safeRedirect(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }
  return from;
}

/**
 * The seeded administrator, for the "Sign in as visitor" shortcut. These are
 * not a secret being leaked: the app has no public sign-up, the same pair is
 * printed in the README, and the account exists so anyone who lands on the demo
 * can look around without being handed credentials first.
 * Hardcoded rather than read from an env var on purpose — the button existing
 * on the deployed demo must not depend on someone remembering to set config.
 */
const DEMO_CREDENTIALS = {
  email: "admin@doctortracker.com",
  password: "Admin@123",
} as const;

/** Which button is mid-request — the two share the form but spin separately. */
type Pending = "form" | "demo" | null;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const busy = pending !== null;

  /**
   * Takes the credentials as arguments rather than reading the state above: the
   * demo button sets that state and signs in within the same event handler, and
   * a state update is not visible to the code that queued it.
   */
  async function signIn(
    credentials: { email: string; password: string },
    source: Exclude<Pending, null>,
  ) {
    setError(null);
    setPending(source);

    try {
      await api.post<{ user: User }>("/auth/login", credentials);

      // replace, not push: the login page should not sit in the back stack.
      router.replace(safeRedirect(searchParams.get("from")));
      // refresh re-runs the (dashboard) layout on the server so the topbar has
      // the user before the page paints.
      router.refresh();
    } catch (cause) {
      // The API answers 401 "Invalid credentials" for both a wrong password and
      // an unknown email — shown verbatim, so this form leaks nothing either.
      setError(errorMessage(cause));
      setPending(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void signIn({ email, password }, "form");
  }

  /**
   * Fills the visible fields *and* submits. The fields are set first so the
   * visitor sees what was used — React flushes both updates when this handler
   * yields at the first await inside signIn, which is well before the request
   * comes back.
   */
  function handleDemoLogin() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    void signIn(DEMO_CREDENTIALS, "demo");
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@doctortracker.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {pending === "form" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* type="button" so it never triggers the form's native submit or its
              required-field validation — it supplies its own credentials. */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleDemoLogin}
            disabled={busy}
          >
            {pending === "demo" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in as visitor…
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Sign in as visitor
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            No account needed to look around — the visitor button fills this form
            with the demo admin and signs in for you. The API sleeps on
            Render&apos;s free tier, so the first sign-in of the day can take up
            to a minute.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
