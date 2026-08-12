import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A patient's condition as a coloured pill.
 *
 * Conditions are free text, so there is no fixed list to assign colours to by
 * hand. The name is hashed into one of five palette slots instead: the same
 * condition is always the same colour, on every page and across reloads, with no
 * state anywhere and nothing to keep in sync when a new condition is entered.
 *
 * The colour is on a dot and a tint, never on the text — the five --chart hues
 * are chosen to be distinguishable from each other, not to be readable at 12px
 * on a light background, and a colour-blind reader still has the word itself.
 */

/**
 * Written out as whole class strings because Tailwind scans source text: a
 * built-up `bg-chart-${n}/10` produces no CSS at all.
 */
const TONES = [
  { tint: "bg-chart-1/10 border-chart-1/30", dot: "bg-chart-1" },
  { tint: "bg-chart-2/10 border-chart-2/30", dot: "bg-chart-2" },
  { tint: "bg-chart-3/10 border-chart-3/30", dot: "bg-chart-3" },
  { tint: "bg-chart-4/10 border-chart-4/30", dot: "bg-chart-4" },
  { tint: "bg-chart-5/10 border-chart-5/30", dot: "bg-chart-5" },
] as const;

/**
 * djb2, lower-cased so "Asthma" and "asthma" land on the same tone. Any cheap
 * avalanching hash would do; what matters is that it is a pure function of the
 * string and stable between renders.
 */
function toneFor(condition: string): (typeof TONES)[number] {
  let hash = 5381;

  for (const char of condition.toLowerCase()) {
    hash = (hash * 33 + char.charCodeAt(0)) % 0xffffffff;
  }

  return TONES[hash % TONES.length];
}

export function ConditionBadge({
  condition,
  className,
}: {
  condition: string;
  className?: string;
}) {
  if (!condition) {
    return <span className="text-muted-foreground">—</span>;
  }

  const tone = toneFor(condition);

  return (
    <Badge variant="outline" className={cn("gap-1.5", tone.tint, className)}>
      <span
        className={cn("size-1.5 shrink-0 rounded-full", tone.dot)}
        aria-hidden="true"
      />
      {condition}
    </Badge>
  );
}
