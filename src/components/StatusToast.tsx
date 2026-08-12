"use client";

import { toast } from "sonner";
import { errorMessage } from "@/lib/api";

/**
 * Success / error feedback for every mutation in the app.
 *
 * There is no component to render here — the <Toaster /> is mounted once in the
 * root layout (Phase 6), so this is just the app's vocabulary for talking to
 * it. Going through one module rather than importing `toast` in fifteen places
 * means duration, wording and the unknown-error fallback are decided once, and
 * swapping sonner out later is a one-file change.
 */

export const notify = {
  success(message: string) {
    toast.success(message);
  },

  /**
   * Takes the raw catch value, not a string: every call site is a `catch
   * (cause: unknown)` and narrowing it at each one is the same three lines
   * repeated.
   */
  error(cause: unknown) {
    toast.error(errorMessage(cause));
  },

  /** For a message the app composes itself rather than one from a rejection. */
  info(message: string) {
    toast(message);
  },
};
