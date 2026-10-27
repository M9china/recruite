/**
 * Single source of truth for application statuses outside the database.
 * Must stay in sync with `enum ApplicationStatus` in prisma/schema.prisma;
 * src/server/prisma-enum-guard.ts fails the typecheck if they drift.
 */
export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSESSMENT_REQUIRED",
  "SHORTLISTED",
  "UNSUCCESSFUL",
  "ACCEPTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Every new application starts here. No public code path may set anything else. */
export const INITIAL_APPLICATION_STATUS: ApplicationStatus = "SUBMITTED";

export const TERMINAL_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  "UNSUCCESSFUL",
  "ACCEPTED",
  "WITHDRAWN",
]);

/**
 * Allowed transitions for the Phase 2 admin workflow. Defined now so the rules
 * live in one place; nothing in Phase 1 calls this outside tests.
 * Confirm with the client before the dashboard is built.
 */
const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "UNSUCCESSFUL", "WITHDRAWN"],
  UNDER_REVIEW: ["ASSESSMENT_REQUIRED", "SHORTLISTED", "UNSUCCESSFUL", "WITHDRAWN"],
  ASSESSMENT_REQUIRED: ["SHORTLISTED", "UNSUCCESSFUL", "WITHDRAWN"],
  SHORTLISTED: ["ACCEPTED", "UNSUCCESSFUL", "WITHDRAWN"],
  UNSUCCESSFUL: [],
  ACCEPTED: [],
  WITHDRAWN: [],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
