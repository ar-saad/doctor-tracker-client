"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The trailing actions column, shared by the doctors and patients tables.
 *
 * Icon-only buttons keep a seven-column table from needing a horizontal scroll
 * on a laptop, but an icon alone is not a label: each one carries an aria-label
 * for screen readers and a tooltip for everyone else. The TooltipProvider is
 * mounted once in the root layout.
 */

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>;
}

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  /** Renders a Link instead of a button — "View" is navigation, not an action. */
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function ActionButton({
  label,
  icon: Icon,
  href,
  onClick,
  destructive = false,
}: ActionButtonProps) {
  const variant = destructive ? "destructive" : "ghost";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button asChild variant={variant} size="icon-sm" aria-label={label}>
            <Link href={href}>
              <Icon />
            </Link>
          </Button>
        ) : (
          <Button
            variant={variant}
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
          >
            <Icon />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
