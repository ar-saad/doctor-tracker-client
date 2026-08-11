import type { Metadata } from "next";
import { Suspense } from "react";
import { Stethoscope } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Doctor Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage doctors and patients.
          </p>
        </div>

        {/* LoginForm reads ?from= with useSearchParams, which needs a Suspense
            boundary or the page cannot be prerendered. */}
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
