import type { z } from "zod";

/** Turns Zod issues into { "personal.surname": ["Enter your surname"] }, first message per field. */
export function toFieldErrors(issues: readonly z.core.$ZodIssue[], prefix: (string | number)[] = []): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = [...prefix, ...issue.path].map(String).join(".") || "_form";
    if (!out[key]) out[key] = [issue.message];
  }
  return out;
}
