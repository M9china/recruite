import { describe, expect, it } from "vitest";
import { submitApplication, UPLOAD_TTL_MS } from "@/server/services/applications";
import { uploadDocument } from "@/server/services/uploads";
import type { OpportunityForSubmission } from "@/server/repositories/types";
import { UniqueConflict } from "@/server/repositories/types";
import {
  createFakeApplicationRepository,
  createMemoryStorage,
  SAMPLE_FILES,
  validDeclarations,
  validQuestionnaire,
} from "../support/fakes";

const NOW = new Date("2026-10-28T09:00:00+02:00");
const day = 24 * 60 * 60 * 1000;

const OPEN: OpportunityForSubmission = {
  id: "opp-open",
  title: "Supply chain clerk",
  slug: "supply-chain-clerk",
  status: "OPEN",
  applicationOpenAt: new Date(NOW.getTime() - 10 * day),
  applicationCloseAt: new Date(NOW.getTime() + 30 * day),
};
const CLOSED: OpportunityForSubmission = { ...OPEN, id: "opp-closed", slug: "closed-role", applicationCloseAt: new Date(NOW.getTime() - day) };

async function setup() {
  let clock = NOW;
  const db = createFakeApplicationRepository({ opportunities: [OPEN, CLOSED], now: () => clock });
  const mem = createMemoryStorage();
  const up = async (bytes: Uint8Array, documentType: string) =>
    (await uploadDocument({ bytes, filename: "f", documentType }, { repo: db.repo, storage: mem.storage })).token;
  const photo = await up(SAMPLE_FILES.jpg, "PHOTO");
  let refs = 0;
  const submit = (overrides: Record<string, unknown> = {}, at: Date = NOW) =>
    submitApplication(
      {
        opportunitySlug: OPEN.slug,
        questionnaire: validQuestionnaire(),
        declarations: validDeclarations(),
        documentTokens: [photo],
        idempotencyKey: "6a0b7c62-1d2e-4f3a-9b8c-7d6e5f4a3b2c",
        ...overrides,
      },
      { repo: db.repo, now: at, newReference: () => `APP-2026-TEST-${String(++refs).padStart(4, "0")}` },
    );
  return { db, up, photo, submit, setClock: (d: Date) => (clock = d) };
}

describe("submitApplication", () => {
  it("saves a valid application with SUBMITTED data, documents and a queued email", async () => {
    const { db, up, photo, submit } = await setup();
    const id = await up(SAMPLE_FILES.pdf, "IDENTITY_DOCUMENT");
    const result = await submit({ documentTokens: [photo, id] });

    expect(result.referenceNumber).toBe("APP-2026-TEST-0001");
    expect(db.applications).toHaveLength(1);
    const app = db.applications[0]!;
    expect(app.applicant).toEqual({ firstName: "Thabo", lastName: "Dlamini", email: "thabo@example.com", phone: "+27 82 123 4567" });
    expect(app.formVersion).toBe(1);
    expect(app.documentIds).toHaveLength(2);
    expect(db.documents.every((d) => d.applicationId === result.referenceNumber)).toBe(true);
    expect(db.outbox).toEqual([
      {
        template: "application_received",
        toEmail: "thabo@example.com",
        payload: { referenceNumber: "APP-2026-TEST-0001", firstName: "Thabo", roleTitle: "Supply chain clerk" },
      },
    ]);
  });

  it("stores cleaned answers, not raw input", async () => {
    const { db, submit } = await setup();
    await submit();
    const q = db.applications[0]!.questionnaire as ReturnType<typeof validQuestionnaire>;
    expect(q.parents.father).toEqual({ has: "NO", details: undefined });
    expect(q.personal.middleName).toBeUndefined();
    expect(q.contact.emails).toEqual(["thabo@example.com"]);
  });

  it("rejects missing required fields with field-level messages", async () => {
    const { db, submit } = await setup();
    const q = validQuestionnaire();
    q.personal.surname = " ";
    (q.parents.mother as { details?: unknown }).details = { surname: "" };
    try {
      await submit({ questionnaire: q });
      throw new Error("expected rejection");
    } catch (e) {
      const err = e as { code: string; fieldErrors: Record<string, string[]> };
      expect(err.code).toBe("VALIDATION_FAILED");
      expect(err.fieldErrors["questionnaire.personal.surname"]).toEqual(["Enter your surname"]);
      expect(err.fieldErrors["questionnaire.parents.mother.details.dateOfBirth"]).toEqual(["Enter their date of birth"]);
    }
    expect(db.applications).toHaveLength(0);
  });

  it("requires every declaration", async () => {
    const { submit } = await setup();
    await expect(submit({ declarations: { truthful: true, matchesDocuments: false, privacyNotice: true } })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("refuses closed roles and unknown roles", async () => {
    const { db, submit } = await setup();
    await expect(submit({ opportunitySlug: CLOSED.slug })).rejects.toMatchObject({ code: "OPPORTUNITY_CLOSED" });
    await expect(submit({ opportunitySlug: "no-such-role" })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(db.applications).toHaveLength(0);
  });

  it("refuses a role whose closing time passed while the applicant was filling in the form", async () => {
    const { submit } = await setup();
    await expect(submit({}, OPEN.applicationCloseAt!)).rejects.toMatchObject({ code: "OPPORTUNITY_CLOSED" });
  });

  it("requires exactly one photo", async () => {
    const { up, submit } = await setup();
    const pdf = await up(SAMPLE_FILES.pdf, "QUALIFICATION");
    await expect(submit({ documentTokens: [pdf] })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    const photo2 = await up(SAMPLE_FILES.png, "PHOTO");
    const photo3 = await up(SAMPLE_FILES.jpg, "PHOTO");
    await expect(submit({ documentTokens: [photo2, photo3] })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("refuses unknown and expired document tokens", async () => {
    const { photo, submit } = await setup();
    await expect(submit({ documentTokens: [photo, "x".repeat(43)] })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await expect(submit({}, new Date(NOW.getTime() + UPLOAD_TTL_MS + 1000))).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("cannot reuse documents attached to another application", async () => {
    const { photo, submit } = await setup();
    await submit();
    const other = validQuestionnaire();
    other.contact.emails = ["someone.else@example.com"];
    await expect(
      submit({ questionnaire: other, idempotencyKey: "0e1f2a3b-4c5d-4e6f-8a9b-0c1d2e3f4a5b", documentTokens: [photo] }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("returns the same reference when the same submission is retried", async () => {
    const { db, submit } = await setup();
    const first = await submit();
    const second = await submit();
    expect(second.referenceNumber).toBe(first.referenceNumber);
    expect(db.applications).toHaveLength(1);
  });

  it("blocks a second application to the same role from the same email", async () => {
    const { up, submit } = await setup();
    await submit();
    const photo = await up(SAMPLE_FILES.png, "PHOTO");
    await expect(
      submit({ idempotencyKey: "0e1f2a3b-4c5d-4e6f-8a9b-0c1d2e3f4a5b", documentTokens: [photo] }),
    ).rejects.toMatchObject({ code: "DUPLICATE_APPLICATION" });
  });

  it("retries with a new reference after a reference collision", async () => {
    const { db, submit } = await setup();
    db.failNextCreate(new UniqueConflict("referenceNumber"));
    const result = await submit();
    expect(result.referenceNumber).toBe("APP-2026-TEST-0002");
    expect(db.applications).toHaveLength(1);
  });

  it("saves nothing and reports nothing as submitted when the database fails", async () => {
    const { db, submit } = await setup();
    db.failNextCreate(new Error("connection terminated"));
    await expect(submit()).rejects.toMatchObject({ message: "connection terminated" });
    expect(db.applications).toHaveLength(0);
    expect(db.outbox).toHaveLength(0);
    expect(db.documents.every((d) => d.applicationId === null)).toBe(true);
  });
});
