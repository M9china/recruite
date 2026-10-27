"use client";

import { useState } from "react";
import { ErrorText, fieldId } from "@/components/form/fields";
import {
  DOCUMENT_RULES,
  type DocumentType,
  formatBytes,
  MAX_DOCUMENTS_PER_APPLICATION,
  MAX_FILE_BYTES,
} from "@/lib/domain/documents";
import type { UploadedDocument } from "./model";

type Props = {
  uploads: UploadedDocument[];
  onChange: (next: (prev: UploadedDocument[]) => UploadedDocument[]) => void;
  onUploadingChange: (delta: number) => void;
  previews: Record<string, string>;
  onPreview: (token: string, url: string | null) => void;
  error?: string;
};

const OTHER_TYPES: DocumentType[] = ["IDENTITY_DOCUMENT", "QUALIFICATION", "OTHER"];

const fileInput =
  "mt-3 block w-full text-base file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-[var(--radius-control)] file:border file:border-forest-800 file:bg-white file:px-4 file:font-semibold file:text-forest-800 hover:file:bg-forest-800 hover:file:text-white";

async function sendFile(file: File, documentType: DocumentType): Promise<{ doc?: UploadedDocument; error?: string }> {
  if (file.size > MAX_FILE_BYTES) return { error: "The file must be smaller than 4 MB" };
  if (file.size === 0) return { error: "The selected file is empty" };
  const body = new FormData();
  body.append("documentType", documentType);
  body.append("file", file);
  try {
    const res = await fetch("/api/public/v1/uploads", { method: "POST", body });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.token) return { doc: data as UploadedDocument };
    return { error: data?.error?.message ?? "The file could not be uploaded. Try again." };
  } catch {
    return { error: "The file could not be uploaded. Check your connection and try again." };
  }
}

export function DocumentsStep({ uploads, onChange, onUploadingChange, previews, onPreview, error }: Props) {
  const [photoError, setPhotoError] = useState<string>();
  const [otherError, setOtherError] = useState<string>();
  const [busy, setBusy] = useState<"photo" | "other" | null>(null);
  const [otherType, setOtherType] = useState<DocumentType>("IDENTITY_DOCUMENT");

  const photo = uploads.find((u) => u.documentType === "PHOTO");
  const others = uploads.filter((u) => u.documentType !== "PHOTO");
  const canAddMore = uploads.length < MAX_DOCUMENTS_PER_APPLICATION;

  async function handle(file: File | undefined, type: DocumentType, slot: "photo" | "other") {
    if (!file) return;
    const setError = slot === "photo" ? setPhotoError : setOtherError;
    setError(undefined);
    setBusy(slot);
    onUploadingChange(1);
    const { doc, error: message } = await sendFile(file, type);
    onUploadingChange(-1);
    setBusy(null);
    if (!doc) {
      setError(message);
      return;
    }
    if (slot === "photo") {
      if (photo) onPreview(photo.token, null);
      onPreview(doc.token, URL.createObjectURL(file));
      onChange((prev) => [...prev.filter((u) => u.documentType !== "PHOTO"), doc]);
    } else {
      onChange((prev) => [...prev, doc]);
    }
  }

  function remove(token: string) {
    onPreview(token, null);
    onChange((prev) => prev.filter((u) => u.token !== token));
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="photo-heading" id={fieldId("documents")} tabIndex={-1} className={error ? "border-l-4 border-alert-600 pl-4" : ""}>
        <h3 id="photo-heading" className="text-3xl">
          Your photo
        </h3>
        <ErrorText id={fieldId("documents")} error={error} />
        <ul className="mt-3 max-w-[60ch] list-disc space-y-1 pl-5 text-stone-500">
          <li>Head and shoulders, facing the camera</li>
          <li>Plain white background</li>
          <li>Recent, in colour, and clearly in focus</li>
          <li>JPG or PNG, smaller than 4 MB</li>
        </ul>

        {photo ? (
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-44 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-stone-300 bg-stone-100">
              {previews[photo.token] ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={previews[photo.token]} alt="Preview of your uploaded photo" className="h-full w-full object-cover" />
              ) : (
                <span className="px-3 text-center text-sm text-stone-500">Photo uploaded</span>
              )}
            </div>
            <div>
              <p className="font-semibold">{photo.filename}</p>
              <p className="text-sm text-stone-500">{formatBytes(photo.size)} · uploaded</p>
              <label htmlFor="photo-replace" className="mt-4 block font-semibold">
                Replace photo
              </label>
              <input
                id="photo-replace"
                type="file"
                accept="image/jpeg,image/png"
                disabled={busy !== null}
                onChange={(e) => {
                  void handle(e.target.files?.[0], "PHOTO", "photo");
                  e.target.value = "";
                }}
                className={fileInput}
              />
              <button type="button" onClick={() => remove(photo.token)} className="mt-3 font-semibold text-alert-600 underline underline-offset-4">
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <label htmlFor="photo-upload" className="block text-lg font-semibold">
              Upload your photo
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png"
              disabled={busy !== null}
              aria-describedby={photoError ? "photo-upload-error" : undefined}
              onChange={(e) => {
                void handle(e.target.files?.[0], "PHOTO", "photo");
                e.target.value = "";
              }}
              className={fileInput}
            />
          </div>
        )}
        {busy === "photo" ? (
          <p role="status" className="mt-3 font-semibold">
            Uploading your photo…
          </p>
        ) : null}
        <ErrorText id="photo-upload" error={photoError} />
      </section>

      <section aria-labelledby="other-heading">
        <h3 id="other-heading" className="text-3xl">
          Supporting documents <span className="font-sans text-lg font-normal text-stone-500">(optional)</span>
        </h3>
        <p className="mt-3 max-w-[60ch] text-stone-500">
          Add copies of your identity document, qualifications or other documents you have been asked for. PDF, JPG or PNG,
          smaller than 4 MB each.
        </p>

        {others.length > 0 ? (
          <ul className="mt-6 divide-y divide-stone-300 border-y border-stone-300">
            {others.map((d) => (
              <li key={d.token} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold">{d.filename}</p>
                  <p className="text-sm text-stone-500">
                    {DOCUMENT_RULES[d.documentType].label} · {formatBytes(d.size)}
                  </p>
                </div>
                <button type="button" onClick={() => remove(d.token)} className="font-semibold text-alert-600 underline underline-offset-4">
                  Remove<span className="sr-only"> {d.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {canAddMore ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
            <div>
              <label htmlFor="other-type" className="block font-semibold">
                Type of document
              </label>
              <select
                id="other-type"
                value={otherType}
                onChange={(e) => setOtherType(e.target.value as DocumentType)}
                className="mt-2 block w-full rounded-[var(--radius-control)] border border-stone-500 bg-white px-3 py-3"
              >
                {OTHER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_RULES[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="other-upload" className="block font-semibold">
                Choose a file
              </label>
              <input
                id="other-upload"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                disabled={busy !== null}
                aria-describedby={otherError ? "other-upload-error" : undefined}
                onChange={(e) => {
                  void handle(e.target.files?.[0], otherType, "other");
                  e.target.value = "";
                }}
                className={fileInput}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 text-stone-500">You have added the maximum of {MAX_DOCUMENTS_PER_APPLICATION} files.</p>
        )}
        {busy === "other" ? (
          <p role="status" className="mt-3 font-semibold">
            Uploading…
          </p>
        ) : null}
        <ErrorText id="other-upload" error={otherError} />
      </section>
    </div>
  );
}
