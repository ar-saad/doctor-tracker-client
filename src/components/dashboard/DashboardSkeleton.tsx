import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_HEIGHT } from "@/components/dashboard/ChartParts";

/**
 * The dashboard's own shape, in grey.
 *
 * It mirrors DashboardClient's grid exactly — four stat cards, a wide chart,
 * then two side by side — so the arrival of the data fills the boxes in rather
 * than reflowing the page under the reader.
 */

function ChartCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_unused, index) => (
          <Card key={index} className="h-full">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="size-9 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartCardSkeleton />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
