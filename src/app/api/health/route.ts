import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { logger } from "@/server/logging/logger";

export const dynamic = "force-dynamic";

/**
 * Liveness + database check for uptime monitors and post-deploy verification.
 * Reports only "ok" / "unavailable"; never connection details.
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("db timeout")), 3000)),
    ]);
    return NextResponse.json(
      { status: "ok", database: "ok", requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    logger.error("health.database_unavailable", { requestId, err });
    return NextResponse.json(
      { status: "degraded", database: "unavailable", requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
