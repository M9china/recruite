/**
 * Removes personal information and secrets before anything is logged.
 * Matching is by key name, case-insensitive, at any depth.
 */
const SENSITIVE_KEYS = new Set(
  [
    "email",
    "toemail",
    "phone",
    "firstname",
    "lastname",
    "name",
    "dateofbirth",
    "idnumber",
    "passport",
    "address",
    "message",
    "password",
    "token",
    "accesstoken",
    "secret",
    "authorization",
    "cookie",
    "apikey",
    "databaseurl",
    "content",
    "body",
  ].map((k) => k.toLowerCase()),
);

export const REDACTED = "[REDACTED]";

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[MaxDepth]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}
