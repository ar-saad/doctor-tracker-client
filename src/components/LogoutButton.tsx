"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Only the API can clear the cookie — it is httpOnly, so no client code can
 * touch it. router.refresh() after the redirect drops the cached Server
 * Component payload, which is what stops the back button from showing the
 * previous user's dashboard.
 */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await api.post("/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Log out</span>
    </Button>
  );
}
