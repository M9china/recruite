/** Dates are always shown in South African time, e.g. "15 December 2026". */
const TIME_ZONE = "Africa/Johannesburg";

const dateFormat = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** Machine-readable value for <time dateTime>. */
export function isoDate(date: Date): string {
  return date.toISOString();
}

/** Splits plain-text content on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
