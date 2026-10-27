import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, sanitiseFilename, sniffMime } from "@/lib/domain/documents";
import { uploadDocument } from "@/server/services/uploads";
import { hashToken } from "@/server/security/tokens";
import { STORAGE_KEY_PATTERN } from "@/server/storage/types";
import { createFakeApplicationRepository, createMemoryStorage, SAMPLE_FILES } from "../support/fakes";

function setup() {
  const db = createFakeApplicationRepository();
  const mem = createMemoryStorage();
  const upload = (bytes: Uint8Array, documentType: unknown, filename = "file.bin") =>
    uploadDocument({ bytes, filename, documentType }, { repo: db.repo, storage: mem.storage });
  return { db, mem, upload };
}

describe("sniffMime", () => {
  it("recognises allowed types by content", () => {
    expect(sniffMime(SAMPLE_FILES.jpg)).toBe("image/jpeg");
    expect(sniffMime(SAMPLE_FILES.png)).toBe("image/png");
    expect(sniffMime(SAMPLE_FILES.pdf)).toBe("application/pdf");
  });
  it("rejects executables and markup", () => {
    expect(sniffMime(SAMPLE_FILES.exe)).toBe(null);
    expect(sniffMime(SAMPLE_FILES.html)).toBe(null);
  });
});

describe("sanitiseFilename", () => {
  it("strips paths and unsafe characters", () => {
    expect(sanitiseFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitiseFilename("C:\\Users\\me\\my <cv>.pdf")).toBe("my cv.pdf");
    expect(sanitiseFilename("")).toBe("document");
  });
});

describe("uploadDocument", () => {
  it("stores a valid photo privately and returns a one-time token", async () => {
    const { db, mem, upload } = setup();
    const result = await upload(SAMPLE_FILES.jpg, "PHOTO", "me.jpeg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(db.documents).toHaveLength(1);
    const doc = db.documents[0]!;
    expect(doc.tokenHash).toBe(hashToken(result.token));
    expect(doc.tokenHash).not.toBe(result.token);
    expect(doc.storageKey).toMatch(STORAGE_KEY_PATTERN);
    expect(doc.storageKey).not.toContain("me.jpeg");
    expect(mem.files.has(doc.storageKey)).toBe(true);
  });

  it("checks content, not the file name", async () => {
    const { upload } = setup();
    await expect(upload(SAMPLE_FILES.exe, "OTHER", "innocent.pdf")).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    await expect(upload(SAMPLE_FILES.html, "OTHER", "page.png")).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
  });

  it("only accepts images for the photo", async () => {
    const { upload } = setup();
    await expect(upload(SAMPLE_FILES.pdf, "PHOTO")).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
  });

  it("rejects empty, oversized and untyped files", async () => {
    const { upload } = setup();
    await expect(upload(new Uint8Array(), "OTHER")).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    big.set(SAMPLE_FILES.pdf);
    await expect(upload(big, "OTHER")).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    await expect(upload(SAMPLE_FILES.pdf, "PASSPORT_SCAN")).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("removes the stored file if the record cannot be saved", async () => {
    const { db, mem } = setup();
    db.repo.createDocument = async () => {
      throw new Error("db down");
    };
    await expect(
      uploadDocument({ bytes: SAMPLE_FILES.png, filename: "a.png", documentType: "PHOTO" }, { repo: db.repo, storage: mem.storage }),
    ).rejects.toMatchObject({ message: "db down" });
    expect(mem.files.size).toBe(0);
  });
});
