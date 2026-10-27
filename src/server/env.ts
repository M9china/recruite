import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated on first use (not at import) so that
 * `next build` works on preview deployments that don't need every secret yet.
 * Never import this from a client component.
 */
const optional = z.string().trim().optional().transform((v) => (v ? v : undefined));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  APP_BASE_URL: z.string().url().transform((v) => v.replace(/\/$/, "")),

  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: optional,
  EMAIL_STAFF_INBOX: optional,
  RESEND_API_KEY: optional,

  TURNSTILE_SECRET_KEY: optional,
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,
  CRON_SECRET: optional,

  STORAGE_ENDPOINT: optional,
  STORAGE_BUCKET: optional,
  STORAGE_ACCESS_KEY_ID: optional,
  STORAGE_SECRET_ACCESS_KEY: optional,
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Names only: values may be secrets.
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${missing}`);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.EMAIL_PROVIDER === "console") {
    throw new Error("EMAIL_PROVIDER=console is not allowed in production");
  }
  cached = parsed.data;
  return cached;
}
