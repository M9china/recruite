import { describe, expect, it } from "vitest";
import {
  buildSubmission,
  COMPACT_ON_STEP,
  compactDraft,
  emptyDraft,
  fromServerErrors,
  getIn,
  setIn,
  stepIndexForPath,
  validateStep,
} from "@/components/apply/model";
import { SubmissionSchema } from "@/lib/validation/application";
import { validQuestionnaire } from "../support/fakes";

const noDocs = { uploads: [], uploading: 0 };

describe("application form model", () => {
  it("sets nested values immutably", () => {
    const a = emptyDraft();
    const b = setIn(a, "questionnaire.contact.phones.0", "082");
    expect(getIn(b, "questionnaire.contact.phones.0")).toBe("082");
    expect(getIn(a, "questionnaire.contact.phones.0")).toBe("");
    expect(b.questionnaire.personal === a.questionnaire.personal).toBe(true);
  });

  it("drops blank extra rows but keeps one", () => {
    let d = emptyDraft();
    d = setIn(d, "questionnaire.contact.phones", ["", "082 123 4567", ""]);
    d = setIn(d, "questionnaire.work.history.1.organisation", "Acme");
    const c = compactDraft(d);
    expect(c.questionnaire.contact.phones).toEqual(["082 123 4567"]);
    expect(c.questionnaire.contact.emails).toEqual([""]);
    expect(c.questionnaire.work.history).toHaveLength(1);
    expect(c.questionnaire.work.history[0]!.organisation).toBe("Acme");
  });

  it("leaves lists on later steps untouched", () => {
    const c = compactDraft(emptyDraft(), COMPACT_ON_STEP.address);
    expect(c.questionnaire.work.history).toHaveLength(2);
  });

  it("validates a step using the shared rules", () => {
    const d = emptyDraft();
    expect(validateStep("role", d, noDocs)).toEqual({ opportunitySlug: "Choose the role you are applying for" });
    expect(Object.keys(validateStep("personal", d, noDocs))).toEqual([
      "personal.surname",
      "personal.firstName",
      "personal.maritalStatus",
    ]);
    expect(validateStep("work", setIn(d, "questionnaire.work.status", "NEVER"), noDocs)).toEqual({});
  });

  it("requires exactly one finished photo upload", () => {
    const d = emptyDraft();
    const photo = { token: "t", documentType: "PHOTO" as const, filename: "p.jpg", size: 1, mimeType: "image/jpeg" };
    expect(validateStep("documents", d, noDocs)).toEqual({ documents: "Upload your photo" });
    expect(validateStep("documents", d, { uploads: [photo], uploading: 1 })).toEqual({
      documents: "Wait for your files to finish uploading",
    });
    expect(validateStep("documents", d, { uploads: [photo], uploading: 0 })).toEqual({});
  });

  it("routes server errors to the right step", () => {
    const errors = fromServerErrors({
      "questionnaire.parents.father.details.surname": ["Enter their surname"],
      "documentTokens.0": ["Invalid"],
    });
    expect(errors).toEqual({ "parents.father.details.surname": "Enter their surname", documents: "Invalid" });
    expect(stepIndexForPath("parents.father.details.surname")).toBe(2);
    expect(stepIndexForPath("documents")).toBe(5);
    expect(stepIndexForPath("contact.emails.1")).toBe(3);
  });

  it("builds a body the server schema accepts", () => {
    const d = { ...emptyDraft("supply-chain-clerk"), questionnaire: validQuestionnaire() as never };
    const body = buildSubmission(
      { ...d, declarations: { truthful: true, matchesDocuments: true, privacyNotice: true } },
      [{ token: "a".repeat(43), documentType: "PHOTO", filename: "p.jpg", size: 1, mimeType: "image/jpeg" }],
      "6a0b7c62-1d2e-4f3a-9b8c-7d6e5f4a3b2c",
      "",
    );
    expect(SubmissionSchema.safeParse(body).success).toBe(true);
  });
});

describe("uuidV4", () => {
  it("produces valid v4 UUIDs even without crypto.randomUUID", async () => {
    const { uuidV4 } = await import("@/lib/uuid");
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      const id = uuidV4();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(SubmissionSchema.shape.idempotencyKey.safeParse(id).success).toBe(true);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });
});
