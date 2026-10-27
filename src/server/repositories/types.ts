import type { Announcement, CareerCategory, CareerOpportunity, EligibilityCriterion, Faq } from "@/content/types";
import type { DocumentType } from "@/lib/domain/documents";

/**
 * Storage-agnostic repository contracts. Services depend on these, so they can
 * be tested with in-memory fakes; src/server/repositories/prisma-*.ts implement
 * them for PostgreSQL. Phase 2 admin repositories sit alongside these.
 */

export interface ContentRepository {
  /** Published categories. */
  listCategories(): Promise<CareerCategory[]>;
  /** Opportunities with status OPEN or CLOSED. */
  listOpportunities(): Promise<CareerOpportunity[]>;
  /** Announcements with status PUBLISHED. */
  listAnnouncements(): Promise<Announcement[]>;
  listFaqs(): Promise<Faq[]>;
  listEligibility(): Promise<EligibilityCriterion[]>;
}

export type OpportunityForSubmission = Pick<
  CareerOpportunity,
  "id" | "title" | "slug" | "status" | "applicationOpenAt" | "applicationCloseAt"
>;

export type PendingDocument = {
  id: string;
  documentType: DocumentType;
  createdAt: Date;
};

export type NewDocument = {
  tokenHash: string;
  storageKey: string;
  documentType: DocumentType;
  originalFilename: string;
  verifiedMimeType: string;
  fileSize: number;
};

export type NewApplication = {
  referenceNumber: string;
  idempotencyKey: string;
  opportunityId: string;
  applicant: { firstName: string; lastName: string; email: string; phone: string };
  questionnaire: unknown;
  formVersion: number;
  privacyNoticeVersion: string;
  consentedAt: Date;
  submittedAt: Date;
  documentIds: string[];
  outbox: { template: string; toEmail: string; payload: Record<string, unknown> };
};

export interface ApplicationRepository {
  findReferenceByIdempotencyKey(idempotencyKey: string): Promise<string | null>;
  findOpportunityBySlug(slug: string): Promise<OpportunityForSubmission | null>;
  /** Uploads not yet attached to an application, matched by token hash. */
  findPendingDocuments(tokenHashes: string[]): Promise<PendingDocument[]>;
  createDocument(doc: NewDocument): Promise<void>;
  /**
   * In one transaction: find or create the applicant, create the application and
   * its first status-history row, attach the documents and queue the email.
   * Throws UniqueConflict or DocumentsUnavailable; nothing is saved if it throws.
   */
  createApplication(input: NewApplication): Promise<void>;
}

export type UniqueTarget = "referenceNumber" | "idempotencyKey" | "applicantOpportunity" | "other";

export class UniqueConflict extends Error {
  constructor(readonly target: UniqueTarget) {
    super(`Unique constraint conflict: ${target}`);
    this.name = "UniqueConflict";
  }
}

/** A document was claimed by another submission between lookup and save. */
export class DocumentsUnavailable extends Error {
  constructor() {
    super("One or more documents are no longer available");
    this.name = "DocumentsUnavailable";
  }
}
