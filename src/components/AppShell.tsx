"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Stethoscope } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarNav } from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User } from "@/types";

/**
 * The protected shell: fixed sidebar from md up, a Sheet drawer below it.
 *
 * A client component because it owns the drawer's open state and the nav needs
 * usePathname — but the user it renders was resolved on the server by the
 * layout, so the topbar never flashes empty.
 */

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2 font-semibold tracking-tight"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Stethoscope className="size-4" />
      </span>
      Doctor Tracker
    </Link>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Brand />
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            {/* Radix handles the focus trap, escape key and scroll lock; the
                title is required for the dialog to be announced correctly. */}
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="h-14 justify-center border-b px-4">
                <SheetTitle className="text-left">
                  <Brand onClick={() => setMobileNavOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <span className="font-semibold md:hidden">Doctor Tracker</span>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                aria-hidden="true"
              >
                {initials(user.name)}
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                {user.name}
              </span>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
