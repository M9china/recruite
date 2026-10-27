/**
 * Rules for applicant documents. Shared by the upload form (to explain limits)
 * and the server (to enforce them). The server never trusts the browser's
 * declared MIME type: it reads the file's first bytes.
 */
export const DOCUMENT_TYPES = ["PHOTO", "IDENTITY_DOCUMENT", "QUALIFICATION", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type AllowedMime = "application/pdf" | "image/jpeg" | "image/png";

/** Vercel functions accept request bodies up to 4.5 MB, so files stay below that. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_APPLICATION = 8;

export const DOCUMENT_RULES: Record<DocumentType, { label: string; mimes: readonly AllowedMime[]; required: boolean }> = {
  PHOTO: { label: "Application photo", mimes: ["image/jpeg", "image/png"], required: true },
  IDENTITY_DOCUMENT: { label: "Identity document or passport", mimes: ["application/pdf", "image/jpeg", "image/png"], required: false },
  QUALIFICATION: { label: "Qualification or certificate", mimes: ["application/pdf", "image/jpeg", "image/png"], required: false },
  OTHER: { label: "Other supporting document", mimes: ["application/pdf", "image/jpeg", "image/png"], required: false },
};

export const MIME_EXTENSION: Record<AllowedMime, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Identifies a file by its signature bytes. Returns null for anything not allowed. */
export function sniffMime(bytes: Uint8Array): AllowedMime | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  return null;
}

/**
 * Keeps a filename only for display to staff: strips any path, control and
 * reserved characters, and limits length. The name never forms part of a storage key.
 */
export function sanitiseFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").replace(/\s+/g, " ").trim();
  const limited = cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned;
  return limited || "document";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
