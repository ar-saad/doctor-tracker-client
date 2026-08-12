/**
 * Client-side field validation for the doctor and patient forms.
 *
 * These rules are a deliberate MIRROR of the backend's Zod schemas, not a
 * replacement for them: the API is still the authority and its 400/409 message
 * is displayed verbatim when it disagrees. Validating here as well is purely so
 * a typo is caught on blur instead of after a round trip — the forms would be
 * correct, just slower and ruder, without it.
 *
 * If this app grew past two forms, the honest answer would be to publish the
 * Zod schemas as a shared package and drop this file. At two forms and ~50
 * lines, a package with its own version and release step costs more than it
 * saves.
 */

/** Same expression the backend uses, so the two cannot disagree on "valid". */
const PHONE_PATTERN = /^[\d\s+()-]{7,20}$/;

/** Intentionally loose — the server does the real check, this just catches typos. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_AGE = 0;
export const MAX_AGE = 130;

/** A map of field name -> message. Empty means the form may be submitted. */
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function requiredText(label: string, value: string): string | undefined {
  return value.trim().length > 0 ? undefined : `${label} is required`;
}

export function validatePhone(value: string): string | undefined {
  const missing = requiredText("Phone", value);
  if (missing) {
    return missing;
  }

  return PHONE_PATTERN.test(value.trim())
    ? undefined
    : "Phone must be a valid phone number";
}

export function validateEmail(value: string): string | undefined {
  const missing = requiredText("Email", value);
  if (missing) {
    return missing;
  }

  return EMAIL_PATTERN.test(value.trim())
    ? undefined
    : "A valid email address is required";
}

/**
 * Age arrives from an <input type="number"> as a string, so "" (cleared) and
 * "abc" (typed in Firefox, which allows it) both have to be rejected before the
 * value is ever sent as a number — the API's schema is strict and will not
 * coerce.
 */
export function validateAge(value: string): string | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Age is required";
  }

  const age = Number(trimmed);

  if (!Number.isFinite(age)) {
    return "Age must be a number";
  }
  if (!Number.isInteger(age)) {
    return "Age must be a whole number";
  }
  if (age < MIN_AGE) {
    return "Age cannot be negative";
  }
  if (age > MAX_AGE) {
    return "Age must be realistic";
  }

  return undefined;
}

/** Drops the undefined entries so `hasErrors` is a plain key count. */
export function collectErrors<T extends string>(
  candidates: Record<T, string | undefined>,
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};

  for (const [field, message] of Object.entries(candidates)) {
    if (typeof message === "string") {
      errors[field as T] = message;
    }
  }

  return errors;
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
