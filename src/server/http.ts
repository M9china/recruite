import "server-only";
import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logging/logger";
import { checkRateLimit } from "@/server/security/rate-limit";
import { hashClientId } from "@/server/security/tokens";

/**
 * Shared plumbing for public API route handlers: request ids, error mapping,
 * logging without personal data, same-origin checks and rate limits.
 */

type Context = { requestId: string };

export async function handleRoute(
  req: Request,
  event: string,
  fn: (ctx: Context) => Promise<Response>,
): Promise<Response> {
  const requestId = req.headers.get("x-vercel-id") ?? crypto.randomUUID();
  try {
    const res = await fn({ requestId });
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Request-Id", requestId);
    return res;
  } catch (err) {
    const { status, body } = toErrorResponse(err, requestId);
    if (err instanceof AppError) {
      logger.info(`${event}.rejected`, { requestId, code: err.code });
    } else {
      logger.error(`${event}.failed`, { requestId, err });
    }
    const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Request-Id": requestId };
    if (err instanceof AppError && err.retryAfterSeconds) headers["Retry-After"] = String(err.retryAfterSeconds);
    return NextResponse.json(body, { status, headers });
  }
}

/** Blocks cross-site form posts. Browsers always send Origin on fetch POSTs. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const allowed = new Set([new URL(req.url).origin, new URL(getEnv().APP_BASE_URL).origin]);
  if (!allowed.has(origin)) throw new AppError("FORBIDDEN", "This request is not allowed.");
}

function clientAddress(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(req: Request, bucket: string, limit: number, windowSeconds: number) {
  const key = `rl:${bucket}:${hashClientId(clientAddress(req))}`;
  const result = await checkRateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Wait a few minutes and try again.", {
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }
}

/** Rejects bodies larger than `maxBytes` before reading them. */
export function assertContentLength(req: Request, maxBytes: number, message: string): void {
  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", message);
}
