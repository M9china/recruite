/**
 * Runs against a real PostgreSQL database (CI provides one; locally set
 * DATABASE_URL to a disposable database with migrations applied).
 * Exercises the Prisma repository and the transaction end to end.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { prismaApplicationRepository } from "@/server/repositories/prisma-applications";
import { submitApplication } from "@/server/services/applications";
import { uploadDocument } from "@/server/services/uploads";
import { createLocalStorage } from "@/server/storage/local";
import { SAMPLE_FILES, validDeclarations, validQuestionnaire } from "../support/fakes";

const run = Boolean(process.env.DATABASE_URL);
const suffix = Math.random().toString(36).slice(2, 8);
const slug = `it-role-${suffix}`;
const email = `it-${suffix}@example.com`;
const dir = mkdtempSync(path.join(tmpdir(), "uploads-"));
const storage = createLocalStorage(dir);

describe.skipIf(!run)("applications against PostgreSQL", () => {
  let categoryId = "";

  beforeAll(async () => {
    const category = await db.careerCategory.create({
      data: { name: "Integration", slug: `it-cat-${suffix}`, description: "Test", published: true },
    });
    categoryId = category.id;
    await db.careerOpportunity.create({
      data: {
        categoryId,
        title: "Integration role",
        slug,
        summary: "s",
        description: "d",
        applicationInstructions: "i",
        status: "OPEN",
        applicationOpenAt: new Date(Date.now() - 86_400_000),
        applicationCloseAt: new Date(Date.now() + 86_400_000),
      },
    });
  });

  afterAll(async () => {
    const applicant = await db.applicant.findUnique({ where: { email } });
    if (applicant) {
      const apps = await db.recruitmentApplication.findMany({ where: { applicantId: applicant.id }, select: { id: true } });
      await db.emailOutbox.deleteMany({ where: { relatedId: { in: apps.map((a) => a.id) } } });
      await db.recruitmentApplication.deleteMany({ where: { applicantId: applicant.id } });
      await db.applicant.delete({ where: { id: applicant.id } });
    }
    await db.applicationDocument.deleteMany({ where: { storageKey: { startsWith: "applicant-documents/" }, applicationId: null, originalFilename: { startsWith: "it-" } } });
    await db.careerOpportunity.deleteMany({ where: { slug } });
    await db.careerCategory.deleteMany({ where: { id: categoryId } });
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  });

  const upload = async (bytes: Uint8Array, documentType: string) =>
    (await uploadDocument({ bytes, filename: `it-${documentType}`, documentType }, { repo: prismaApplicationRepository, storage })).token;

  const body = (token: string, idempotencyKey: string) => {
    const questionnaire = validQuestionnaire();
    questionnaire.contact.emails = [email];
    return { opportunitySlug: slug, questionnaire, declarations: validDeclarations(), documentTokens: [token], idempotencyKey };
  };

  it("saves the application, history, documents and email in one transaction", async () => {
    const photo = await upload(SAMPLE_FILES.jpg, "PHOTO");
    const { referenceNumber } = await submitApplication(body(photo, crypto.randomUUID()), { repo: prismaApplicationRepository });

    const saved = await db.recruitmentApplication.findUniqueOrThrow({
      where: { referenceNumber },
      include: { applicant: true, documents: true, statusHistory: true },
    });
    expect(saved.status).toBe("SUBMITTED");
    expect(saved.applicant.email).toBe(email);
    expect(saved.documents).toHaveLength(1);
    expect(saved.statusHistory.map((h) => h.toStatus)).toEqual(["SUBMITTED"]);
    expect((saved.questionnaire as { personal: { surname: string } }).personal.surname).toBe("Dlamini");
    expect(await db.emailOutbox.count({ where: { relatedId: saved.id, status: "PENDING" } })).toBe(1);
  });

  it("blocks a second application to the same role and rolls back completely", async () => {
    const photo = await upload(SAMPLE_FILES.png, "PHOTO");
    const key = crypto.randomUUID();
    await expect(submitApplication(body(photo, key), { repo: prismaApplicationRepository })).rejects.toMatchObject({
      code: "DUPLICATE_APPLICATION",
    });
    // The photo was not claimed, because the failed transaction rolled back.
    const pending = await db.applicationDocument.count({ where: { originalFilename: "it-PHOTO", applicationId: null } });
    expect(pending).toBeGreaterThanOrEqual(1);
  });

  it("is idempotent for the same key", async () => {
    const existing = await db.recruitmentApplication.findFirstOrThrow({ where: { applicant: { email } } });
    const again = await submitApplication(body("x".repeat(43), existing.idempotencyKey), { repo: prismaApplicationRepository });
    expect(again.referenceNumber).toBe(existing.referenceNumber);
  });
});
