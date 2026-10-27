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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "1965-04-12" → "12 April 1965". Formats the string directly so time zones cannot shift the day. */
export function formatIsoDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`;
}

/** "2022-01" → "January 2022". */
export function formatIsoMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  return `${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`;
}
