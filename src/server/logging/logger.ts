import "server-only";
import { redact } from "./redact";

type Level = "debug" | "info" | "warn" | "error";

/**
 * Structured JSON logger. Vercel captures stdout/stderr; a log drain or Sentry
 * can be added later without touching call sites. Context is always redacted.
 */
function write(level: Level, event: string, context: Record<string, unknown> = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(redact(context) as Record<string, unknown>),
  });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write("debug", event, context),
  info: (event: string, context?: Record<string, unknown>) => write("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => write("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => write("error", event, context),
};
