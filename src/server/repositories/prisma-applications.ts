import "server-only";
import { Prisma } from "@prisma/client";
import type { DocumentType } from "@/lib/domain/documents";
import { INITIAL_APPLICATION_STATUS } from "@/lib/domain/application-status";
import { db } from "@/server/db";
import { type ApplicationRepository, DocumentsUnavailable, UniqueConflict, type UniqueTarget } from "./types";

function uniqueTarget(err: Prisma.PrismaClientKnownRequestError): UniqueTarget {
  // meta.target is a field list or a constraint name, depending on the driver.
  const target = JSON.stringify(err.meta?.target ?? "");
  if (target.includes("referenceNumber")) return "referenceNumber";
  if (target.includes("idempotencyKey")) return "idempotencyKey";
  if (target.includes("applicantId")) return "applicantOpportunity";
  return "other";
}

function isUniqueViolation(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export const prismaApplicationRepository: ApplicationRepository = {
  async findReferenceByIdempotencyKey(idempotencyKey) {
    const row = await db.recruitmentApplication.findUnique({
      where: { idempotencyKey },
      select: { referenceNumber: true },
    });
    return row?.referenceNumber ?? null;
  },

  findOpportunityBySlug: (slug) =>
    db.careerOpportunity.findFirst({
      where: { slug, category: { published: true } },
      select: { id: true, title: true, slug: true, status: true, applicationOpenAt: true, applicationCloseAt: true },
    }),

  async findPendingDocuments(tokenHashes) {
    const rows = await db.applicationDocument.findMany({
      where: { uploadToken: { in: tokenHashes }, applicationId: null },
      select: { id: true, documentType: true, createdAt: true },
    });
    return rows.map((r) => ({ ...r, documentType: r.documentType as DocumentType }));
  },

  async createDocument(doc) {
    await db.applicationDocument.create({
      data: {
        uploadToken: doc.tokenHash,
        storageKey: doc.storageKey,
        documentType: doc.documentType,
        originalFilename: doc.originalFilename,
        verifiedMimeType: doc.verifiedMimeType,
        fileSize: doc.fileSize,
      },
    });
  },

  async createApplication(input) {
    try {
      await db.$transaction(async (tx) => {
        // An existing applicant's stored details are not overwritten by a new
        // submission; each application keeps its own answers in `questionnaire`.
        const applicant = await tx.applicant.upsert({
          where: { email: input.applicant.email },
          create: input.applicant,
          update: {},
          select: { id: true },
        });

        const application = await tx.recruitmentApplication.create({
          data: {
            referenceNumber: input.referenceNumber,
            idempotencyKey: input.idempotencyKey,
            applicantId: applicant.id,
            careerOpportunityId: input.opportunityId,
            status: INITIAL_APPLICATION_STATUS,
            questionnaire: input.questionnaire as Prisma.InputJsonValue,
            formVersion: input.formVersion,
            privacyNoticeVersion: input.privacyNoticeVersion,
            consentedAt: input.consentedAt,
            submittedAt: input.submittedAt,
            statusHistory: { create: { fromStatus: null, toStatus: INITIAL_APPLICATION_STATUS } },
          },
          select: { id: true },
        });

        if (input.documentIds.length > 0) {
          const { count } = await tx.applicationDocument.updateMany({
            where: { id: { in: input.documentIds }, applicationId: null },
            data: { applicationId: application.id },
          });
          if (count !== input.documentIds.length) throw new DocumentsUnavailable();
        }

        await tx.emailOutbox.create({
          data: {
            template: input.outbox.template,
            toEmail: input.outbox.toEmail,
            payload: input.outbox.payload as Prisma.InputJsonValue,
            relatedId: application.id,
          },
        });
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new UniqueConflict(uniqueTarget(err));
      throw err;
    }
  },
};
