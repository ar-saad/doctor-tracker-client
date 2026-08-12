import { format, isValid, parseISO } from "date-fns";

/**
 * Display formatting shared by every table and detail card.
 *
 * Kept in one module so a "Created" column reads the same on /doctors,
 * /patients and the doctor detail page — three places that would otherwise each
 * grow their own toLocaleDateString call with slightly different options.
 */

/** The wire format the API's startDate/endDate filters expect. */
export const API_DATE_FORMAT = "yyyy-MM-dd";

/** "2026-08-11T09:12:00.000Z" -> "11 Aug 2026". Falls back to an em dash. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = parseISO(iso);
  return isValid(date) ? format(date, "d MMM yyyy") : "—";
}

/**
 * "2026-08-11" -> "11 Aug", for chart axis ticks. The year is the same on every
 * tick of a 14-day window, so it is noise there — the tooltip still spells the
 * full date out with formatDate.
 */
export function formatDayMonth(iso: string): string {
  const date = parseISO(iso);
  return isValid(date) ? format(date, "d MMM") : iso;
}

/**
 * Thousands separators for the dashboard's big numbers. The locale is fixed
 * rather than left to the browser so the digits do not depend on who is looking.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

/** A Date from the calendar popover, as the API wants it in the query string. */
export function toApiDate(date: Date): string {
  return format(date, API_DATE_FORMAT);
}

/** A "yyyy-MM-dd" URL param back to a Date for the calendar's selected state. */
export function fromApiDate(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

/** Empty strings render as an em dash rather than an invisible cell. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

/** "male" -> "Male", for the gender column. */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
