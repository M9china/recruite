import type { z } from "zod";
import type { DocumentType } from "@/lib/domain/documents";
import { toFieldErrors } from "@/lib/validation/errors";
import {
  ContactSchema,
  DeclarationsSchema,
  ParentsSchema,
  PersonalSchema,
  ResidenceSchema,
  WorkSchema,
} from "@/lib/validation/questionnaire";

/**
 * Client-side model of the application form: the draft shape (all strings, so
 * inputs stay controlled), the steps, and per-step validation using the same
 * schemas the server applies to the whole submission.
 */

export type ParentDraft = {
  has: string;
  details: { surname: string; firstNames: string; middleName: string; dateOfBirth: string; placeOfBirth: string };
};

export type HistoryDraft = { organisation: string; role: string; address: string; from: string; to: string };

export type Draft = {
  opportunitySlug: string;
  questionnaire: {
    personal: {
      surname: string;
      firstName: string;
      middleName: string;
      maritalStatus: string;
      spouse: { birthCountry: string; birthCity: string; citizenship: string };
    };
    parents: { father: ParentDraft; mother: ParentDraft };
    residence: {
      status: string;
      address: { country: string; postalCode: string; city: string; street: string; building: string; apartment: string };
    };
    contact: { phones: string[]; emails: string[] };
    work: { status: string; history: HistoryDraft[] };
  };
  declarations: { truthful: boolean; matchesDocuments: boolean; privacyNotice: boolean };
};

export type UploadedDocument = {
  token: string;
  documentType: DocumentType;
  filename: string;
  size: number;
  mimeType: string;
};

export const emptyParent = (): ParentDraft => ({
  has: "",
  details: { surname: "", firstNames: "", middleName: "", dateOfBirth: "", placeOfBirth: "" },
});

export const emptyHistory = (): HistoryDraft => ({ organisation: "", role: "", address: "", from: "", to: "" });

export function emptyDraft(opportunitySlug = ""): Draft {
  return {
    opportunitySlug,
    questionnaire: {
      personal: {
        surname: "",
        firstName: "",
        middleName: "",
        maritalStatus: "",
        spouse: { birthCountry: "", birthCity: "", citizenship: "" },
      },
      parents: { father: emptyParent(), mother: emptyParent() },
      residence: {
        status: "",
        address: { country: "", postalCode: "", city: "", street: "", building: "", apartment: "" },
      },
      contact: { phones: [""], emails: [""] },
      // Two slots because the questionnaire asks for at least the two most recent places.
      work: { status: "", history: [emptyHistory(), emptyHistory()] },
    },
    declarations: { truthful: false, matchesDocuments: false, privacyNotice: false },
  };
}

// ---------------------------------------------------------------------------
// Immutable path helpers
// ---------------------------------------------------------------------------

type Path = (string | number)[];
export const toPath = (path: string): Path => path.split(".").map((p) => (/^\d+$/.test(p) ? Number(p) : p));

export function getIn(obj: unknown, path: string): unknown {
  return toPath(path).reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), obj);
}

export function setIn<T>(obj: T, path: string, value: unknown): T {
  const go = (o: unknown, keys: Path): unknown => {
    if (keys.length === 0) return value;
    const [k, ...rest] = keys as [string | number, ...Path];
    const copy = (Array.isArray(o) ? [...o] : { ...(o as object) }) as Record<string | number, unknown>;
    copy[k] = go(copy[k], rest);
    return copy;
  };
  return go(obj, toPath(path)) as T;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const STEPS = [
  { key: "role", title: "Choose a role", prefixes: ["opportunitySlug"] },
  { key: "personal", title: "About you", prefixes: ["personal"] },
  { key: "parents", title: "Your parents", prefixes: ["parents"] },
  { key: "address", title: "Address and contact details", prefixes: ["residence", "contact"] },
  { key: "work", title: "Work and education", prefixes: ["work"] },
  { key: "documents", title: "Photo and documents", prefixes: ["documents", "documentTokens"] },
  { key: "review", title: "Check and submit", prefixes: ["declarations", "_form"] },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

/** Which lists each step tidies when the applicant continues. */
export const COMPACT_ON_STEP: Partial<Record<StepKey, readonly ("contact" | "work")[]>> = {
  address: ["contact"],
  work: ["work"],
};

export function stepIndexForPath(path: string): number {
  const i = STEPS.findIndex((s) => s.prefixes.some((p) => path === p || path.startsWith(`${p}.`)));
  return i === -1 ? STEPS.length - 1 : i;
}

// ---------------------------------------------------------------------------
// Tidying and validation
// ---------------------------------------------------------------------------

const isBlank = (o: Record<string, string>) => Object.values(o).every((v) => v.trim() === "");

/**
 * Removes blank extra rows (a second phone left empty, an unused history slot)
 * so they don't block the applicant, while keeping at least one row so a
 * required list still reports "enter at least one". Only the given sections
 * are tidied, so lists on steps the applicant hasn't reached keep their slots.
 */
export function compactDraft(draft: Draft, sections: readonly ("contact" | "work")[] = ["contact", "work"]): Draft {
  const q = draft.questionnaire;
  const keepOne = <T>(list: T[], blank: (t: T) => boolean, empty: () => T) => {
    const kept = list.filter((x) => !blank(x));
    return kept.length > 0 ? kept : [empty()];
  };
  return {
    ...draft,
    questionnaire: {
      ...q,
      contact: sections.includes("contact")
        ? {
            phones: keepOne(q.contact.phones, (p) => p.trim() === "", () => ""),
            emails: keepOne(q.contact.emails, (e) => e.trim() === "", () => ""),
          }
        : q.contact,
      work: sections.includes("work") ? { ...q.work, history: keepOne(q.work.history, isBlank, emptyHistory) } : q.work,
    },
  };
}

type Errors = Record<string, string>;

function check(schema: z.ZodType, value: unknown, prefix: string): Errors {
  const result = schema.safeParse(value);
  if (result.success) return {};
  const all = toFieldErrors(result.error.issues, [prefix]);
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v[0]!]));
}

export type DocumentsState = { uploads: UploadedDocument[]; uploading: number };

/** Validates one step of an already-compacted draft. Empty object = the step is complete. */
export function validateStep(step: StepKey, draft: Draft, docs: DocumentsState): Errors {
  const q = draft.questionnaire;
  switch (step) {
    case "role":
      return draft.opportunitySlug ? {} : { opportunitySlug: "Choose the role you are applying for" };
    case "personal":
      return check(PersonalSchema, q.personal, "personal");
    case "parents":
      return check(ParentsSchema, q.parents, "parents");
    case "address":
      return { ...check(ResidenceSchema, q.residence, "residence"), ...check(ContactSchema, q.contact, "contact") };
    case "work":
      return check(WorkSchema, q.work, "work");
    case "documents": {
      if (docs.uploading > 0) return { documents: "Wait for your files to finish uploading" };
      const photos = docs.uploads.filter((u) => u.documentType === "PHOTO").length;
      return photos === 1 ? {} : { documents: photos === 0 ? "Upload your photo" : "Upload one photo only" };
    }
    case "review":
      return check(DeclarationsSchema, draft.declarations, "declarations");
  }
}

/**
 * Maps server field errors ("questionnaire.personal.surname", "documentTokens.1")
 * onto the form's own paths.
 */
export function fromServerErrors(fieldErrors: Record<string, string[]>): Errors {
  const out: Errors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    let path = key.replace(/^questionnaire\./, "");
    if (path.startsWith("documentTokens")) path = "documents";
    if (!out[path]) out[path] = messages[0] ?? "Check this answer";
  }
  return out;
}

export function buildSubmission(draft: Draft, uploads: UploadedDocument[], idempotencyKey: string, website: string) {
  return {
    opportunitySlug: draft.opportunitySlug,
    questionnaire: draft.questionnaire,
    declarations: draft.declarations,
    documentTokens: uploads.map((u) => u.token),
    idempotencyKey,
    website,
  };
}
