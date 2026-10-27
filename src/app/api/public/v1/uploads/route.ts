import { NextResponse } from "next/server";
import { MAX_FILE_BYTES } from "@/lib/domain/documents";
import { AppError } from "@/lib/errors";
import { assertContentLength, assertSameOrigin, enforceRateLimit, handleRoute } from "@/server/http";
import { prismaApplicationRepository } from "@/server/repositories/prisma-applications";
import { uploadDocument } from "@/server/services/uploads";
import { getDocumentStorage } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data: file, documentType.
 * 201 → { token, documentType, filename, size, mimeType }
 * The token is a secret: it is the only way to attach this file to an application.
 */
export async function POST(req: Request) {
  return handleRoute(req, "uploads.create", async () => {
    assertSameOrigin(req);
    await enforceRateLimit(req, "uploads", 30, 15 * 60);
    // Multipart overhead is small; anything far above the file limit is rejected unread.
    assertContentLength(req, MAX_FILE_BYTES + 64 * 1024, "The file must be smaller than 4 MB.");

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError("VALIDATION_FAILED", "The upload could not be read. Try again.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_FAILED", "Choose a file to upload.", { fieldErrors: { file: ["Choose a file to upload"] } });
    }

    const result = await uploadDocument(
      { bytes: new Uint8Array(await file.arrayBuffer()), filename: file.name, documentType: form.get("documentType") },
      { repo: prismaApplicationRepository, storage: getDocumentStorage() },
    );
    return NextResponse.json(result, { status: 201 });
  });
}
