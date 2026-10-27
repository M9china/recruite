import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  DOCUMENT_RULES,
  DOCUMENT_TYPES,
  type DocumentType,
  MAX_FILE_BYTES,
  MIME_EXTENSION,
  sanitiseFilename,
  sniffMime,
} from "@/lib/domain/documents";
import { AppError } from "@/lib/errors";
import type { ApplicationRepository } from "@/server/repositories/types";
import { hashToken, newUploadToken } from "@/server/security/tokens";
import type { DocumentStorage } from "@/server/storage/types";

export type UploadInput = { bytes: Uint8Array; filename: string; documentType: unknown };

export type UploadResult = {
  token: string;
  documentType: DocumentType;
  filename: string;
  size: number;
  mimeType: string;
};

export type UploadDeps = {
  repo: Pick<ApplicationRepository, "createDocument">;
  storage: DocumentStorage;
  newToken?: () => string;
  newKey?: (ext: string) => string;
};

const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);

/**
 * Validates and stores one applicant document. The file is checked by its
 * content (not its name or declared type), stored privately under a random key,
 * and recorded unattached. The caller gets a secret token that the application
 * submission uses to claim it.
 */
export async function uploadDocument(input: UploadInput, deps: UploadDeps): Promise<UploadResult> {
  const typeResult = DocumentTypeSchema.safeParse(input.documentType);
  if (!typeResult.success) {
    throw new AppError("VALIDATION_FAILED", "Choose what kind of document this is.", {
      fieldErrors: { documentType: ["Choose what kind of document this is"] },
    });
  }
  const documentType = typeResult.data;
  const rules = DOCUMENT_RULES[documentType];

  if (input.bytes.byteLength === 0) {
    throw new AppError("VALIDATION_FAILED", "The selected file is empty.", { fieldErrors: { file: ["The selected file is empty"] } });
  }
  if (input.bytes.byteLength > MAX_FILE_BYTES) {
    throw new AppError("PAYLOAD_TOO_LARGE", "The file must be smaller than 4 MB.");
  }

  const mime = sniffMime(input.bytes);
  if (!mime || !rules.mimes.includes(mime)) {
    const allowed = documentType === "PHOTO" ? "a JPG or PNG image" : "a PDF, JPG or PNG file";
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", `The file must be ${allowed}.`);
  }

  const token = (deps.newToken ?? newUploadToken)();
  const storageKey = (deps.newKey ?? ((ext) => `applicant-documents/${randomUUID()}.${ext}`))(MIME_EXTENSION[mime]);
  const filename = sanitiseFilename(input.filename);

  await deps.storage.put(storageKey, input.bytes, mime);
  try {
    await deps.repo.createDocument({
      tokenHash: hashToken(token),
      storageKey,
      documentType,
      originalFilename: filename,
      verifiedMimeType: mime,
      fileSize: input.bytes.byteLength,
    });
  } catch (err) {
    // Don't leave an orphaned file behind if the record could not be saved.
    await deps.storage.delete(storageKey).catch(() => undefined);
    throw err;
  }

  return { token, documentType, filename, size: input.bytes.byteLength, mimeType: mime };
}
