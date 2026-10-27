import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { assertContentLength, assertSameOrigin, enforceRateLimit, handleRoute } from "@/server/http";
import { logger } from "@/server/logging/logger";
import { prismaApplicationRepository } from "@/server/repositories/prisma-applications";
import { submitApplication } from "@/server/services/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST application/json — see SubmissionSchema in src/lib/validation/application.ts.
 * 201 → { referenceNumber }. Errors use the shared { error: { code, message, fieldErrors? } } shape.
 * There is deliberately no GET: submitted applications are never readable through the public API.
 */
export async function POST(req: Request) {
  return handleRoute(req, "applications.submit", async ({ requestId }) => {
    assertSameOrigin(req);
    await enforceRateLimit(req, "applications", 10, 60 * 60);
    assertContentLength(req, 256 * 1024, "The application is too large to submit.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new AppError("VALIDATION_FAILED", "The application could not be read. Try again.");
    }

    // Honeypot: a field hidden from people that simple bots fill in.
    if (body && typeof body === "object" && "website" in body && (body as { website?: unknown }).website) {
      throw new AppError("BOT_CHECK_FAILED", "The application could not be submitted. Try again.");
    }

    const result = await submitApplication(body, { repo: prismaApplicationRepository });
    logger.info("applications.submitted", { requestId, referenceNumber: result.referenceNumber });
    return NextResponse.json(result, { status: 201 });
  });
}
