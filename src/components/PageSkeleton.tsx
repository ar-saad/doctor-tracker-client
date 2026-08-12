import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Suspense fallback for the list pages.
 *
 * Every page below is a Client Component that reads useSearchParams, which
 * Next.js requires to sit inside a Suspense boundary — without one the whole
 * route opts out of static rendering at build time. This is what that boundary
 * shows: the page's own shape, so the switch to real content is a fill-in
 * rather than a re-layout.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-sm" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <div className="space-y-px rounded-xl border p-4">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="my-3 h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
