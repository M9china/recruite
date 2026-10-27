import "server-only";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logging/logger";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export interface RateLimiter {
  hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

/**
 * Fixed-window counter in process memory. Only suitable for development:
 * each serverless instance has its own memory, so limits are not shared.
 */
export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, limit, windowSeconds) {
      const t = now();
      let w = windows.get(key);
      if (!w || w.resetAt <= t) {
        w = { count: 0, resetAt: t + windowSeconds * 1000 };
        windows.set(key, w);
      }
      w.count += 1;
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (v.resetAt <= t) windows.delete(k);
      }
      return { allowed: w.count <= limit, retryAfterSeconds: Math.ceil((w.resetAt - t) / 1000) };
    },
  };
}

/** Shared fixed-window counter in Upstash Redis via its REST API (no client library needed). */
export function createUpstashRateLimiter(url: string, token: string): RateLimiter {
  return {
    async hit(key, limit, windowSeconds) {
      const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(windowSeconds), "NX"],
          ["TTL", key],
        ]),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
      const [count, , ttl] = (await res.json()) as [{ result: number }, unknown, { result: number }];
      return { allowed: count.result <= limit, retryAfterSeconds: Math.max(ttl.result, 1) };
    },
  };
}

let instance: RateLimiter | undefined;

function getRateLimiter(): RateLimiter {
  if (instance) return instance;
  const env = getEnv();
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    instance = createUpstashRateLimiter(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  } else {
    if (process.env.VERCEL_ENV === "production") {
      logger.warn("rate_limit.memory_fallback_in_production");
    }
    instance = createMemoryRateLimiter();
  }
  return instance;
}

/** Fails open if Redis is unreachable, so an outage there cannot block applicants. */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    return await getRateLimiter().hit(key, limit, windowSeconds);
  } catch (err) {
    logger.error("rate_limit.unavailable", { err });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
