/** Emails are stored lowercased and trimmed so one person maps to one Applicant. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
