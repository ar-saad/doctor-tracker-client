import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/server-api";

/**
 * The protected shell for every authenticated route. (dashboard) is a route
 * group: it shares this layout without adding a URL segment, so this file wraps
 * /, /doctors, /doctors/[id] and /patients.
 *
 * proxy.ts has already bounced anyone without a cookie, but it only checks that
 * the cookie EXISTS. This call is what proves the session is real: /auth/me is
 * verified by the API against the JWT secret, and a forged or expired cookie
 * lands here as null.
 *
 * Props are typed by hand rather than with LayoutProps<"/"> because the root
 * layout and this one both map to "/" — the generated type belongs to the root.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
