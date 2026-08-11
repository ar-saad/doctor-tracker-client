import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * Temporary stand-in so the shell's navigation is fully walkable at the end of
 * Phase 6. Phases 7-9 replace each of these pages outright.
 */
export function PhasePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex min-h-40 flex-col items-center justify-center gap-1 text-center">
          <CardTitle className="text-base">Coming in {phase}</CardTitle>
          <CardDescription>
            The shell, session and API client are wired — this view is next.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
