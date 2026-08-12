"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, ModalFooter } from "@/components/Modal";
import { notify } from "@/components/StatusToast";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";

/**
 * "Are you sure?" for every destructive action.
 *
 * It owns the pending state and the try/catch itself, so a caller supplies only
 * the promise and what to do after it resolves. Deleting a doctor cascades to
 * their patients, and that consequence belongs in the copy — hence the
 * free-form `description` rather than a fixed sentence.
 */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  /** Awaited; the dialog stays open and shows the error if it rejects. */
  onConfirm: () => Promise<void>;
  /** Shown as a toast once onConfirm resolves. */
  successMessage?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  successMessage,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);

    try {
      await onConfirm();

      if (successMessage) {
        notify.success(successMessage);
      }
      onOpenChange(false);
    } catch (cause) {
      // Kept inline rather than toasted: the failure belongs next to the button
      // that caused it, and the dialog stays open so it can be retried.
      setError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
        }
        onOpenChange(next);
      }}
      title={title}
      busy={pending}
      className="sm:max-w-md"
    >
      <div className="space-y-3 text-sm text-muted-foreground">
        <div>{description}</div>
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
