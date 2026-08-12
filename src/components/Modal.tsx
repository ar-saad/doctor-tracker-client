"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * The app's modal shape: title, optional description, body.
 *
 * Thin on purpose. Everything that makes a dialog correct — focus trap, focus
 * restore on close, Escape, aria-modal, the labelled title, scroll lock — comes
 * from the Radix primitive underneath ui/dialog. This wrapper only fixes the
 * composition so a form modal and a confirm modal cannot drift apart, and so
 * DialogDescription is never forgotten (Radix warns when a dialog has none).
 *
 * ONE IMPORTANT PROPERTY, relied on by both form modals: Radix does not render
 * the content while the dialog is closed. Anything mounted in here therefore
 * starts from clean state on every open, which is why neither form needs a
 * "reset the fields" effect.
 */

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Set while a request is in flight: blocks Escape / overlay-click dismissal. */
  busy?: boolean;
}

/**
 * The button bar. Rendered as part of `children` rather than as a prop so that
 * a form's submit button can sit INSIDE its own <form> element — the alternative
 * is wiring it back with a form="id" attribute, which works but is easy to
 * forget and impossible to type-check.
 */
export function ModalFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={cn("mt-4", className)} {...props} />;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  busy = false,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("sm:max-w-lg", className)}
        showCloseButton={!busy}
        // Closing mid-submit would leave a request in flight with nowhere to
        // report its error, so both dismissal routes are gated on `busy`.
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            // Radix logs a warning for a dialog with no description; a hidden
            // one satisfies it without inventing copy.
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
