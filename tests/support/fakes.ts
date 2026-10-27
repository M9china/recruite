import { categories, opportunities } from "../../prisma/seed-data/careers";
import { announcements, eligibility, faqs } from "../../prisma/seed-data/records";
import {
  type ApplicationRepository,
  type ContentRepository,
  DocumentsUnavailable,
  type NewApplication,
  type NewDocument,
  type OpportunityForSubmission,
  UniqueConflict,
} from "@/server/repositories/types";
import type { DocumentStorage } from "@/server/storage/types";

export const seedContentRepository: ContentRepository = {
  listCategories: async () => categories,
  listOpportunities: async () => opportunities,
  listAnnouncements: async () => announcements,
  listFaqs: async () => faqs,
  listEligibility: async () => eligibility,
};

type StoredDocument = NewDocument & { id: string; createdAt: Date; applicationId: string | null };

/** In-memory ApplicationRepository with the same constraints as the database. */
export function createFakeApplicationRepository(seed: { opportunities?: OpportunityForSubmission[]; now?: () => Date } = {}) {
  const now = seed.now ?? (() => new Date());
  const opps = seed.opportunities ?? [];
  const documents: StoredDocument[] = [];
  const applications: (NewApplication & { applicantEmail: string })[] = [];
  const outbox: NewApplication["outbox"][] = [];
  let nextId = 1;
  /** Test hook: make the next createApplication throw this error. */
  let failNext: Error | null = null;

  const repo: ApplicationRepository = {
    async findReferenceByIdempotencyKey(key) {
      return applications.find((a) => a.idempotencyKey === key)?.referenceNumber ?? null;
    },
    async findOpportunityBySlug(slug) {
      return opps.find((o) => o.slug === slug) ?? null;
    },
    async findPendingDocuments(hashes) {
      return documents
        .filter((d) => hashes.includes(d.tokenHash) && d.applicationId === null)
        .map((d) => ({ id: d.id, documentType: d.documentType, createdAt: d.createdAt }));
    },
    async createDocument(doc) {
      if (documents.some((d) => d.tokenHash === doc.tokenHash || d.storageKey === doc.storageKey)) {
        throw new UniqueConflict("other");
      }
      documents.push({ ...doc, id: `doc_${nextId++}`, createdAt: now(), applicationId: null });
    },
    async createApplication(input) {
      if (failNext) {
        const e = failNext;
        failNext = null;
        throw e;
      }
      if (applications.some((a) => a.referenceNumber === input.referenceNumber)) throw new UniqueConflict("referenceNumber");
      if (applications.some((a) => a.idempotencyKey === input.idempotencyKey)) throw new UniqueConflict("idempotencyKey");
      if (applications.some((a) => a.applicantEmail === input.applicant.email && a.opportunityId === input.opportunityId)) {
        throw new UniqueConflict("applicantOpportunity");
      }
      const claimed = documents.filter((d) => input.documentIds.includes(d.id) && d.applicationId === null);
      if (claimed.length !== input.documentIds.length) throw new DocumentsUnavailable();
      // Commit: everything below happens together, as in the database transaction.
      claimed.forEach((d) => (d.applicationId = input.referenceNumber));
      applications.push({ ...input, applicantEmail: input.applicant.email });
      outbox.push(input.outbox);
    },
  };

  return {
    repo,
    documents,
    applications,
    outbox,
    failNextCreate(err: Error) {
      failNext = err;
    },
  };
}

export function createMemoryStorage() {
  const files = new Map<string, { bytes: Uint8Array; contentType: string }>();
  let failPut = false;
  const storage: DocumentStorage = {
    async put(key, bytes, contentType) {
      if (failPut) throw new Error("storage unavailable");
      files.set(key, { bytes, contentType });
    },
    async delete(key) {
      files.delete(key);
    },
  };
  return {
    storage,
    files,
    failPuts() {
      failPut = true;
    },
  };
}

/** Minimal valid file bodies for each allowed type. */
export const SAMPLE_FILES = {
  jpg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  png: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
  pdf: new TextEncoder().encode("%PDF-1.7\n%test"),
  exe: new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03]),
  html: new TextEncoder().encode("<html><script>alert(1)</script>"),
};

/** A complete, valid questionnaire. */
export function validQuestionnaire() {
  return {
    personal: { surname: "Dlamini", firstName: "Thabo", middleName: "", maritalStatus: "NEVER_MARRIED" },
    parents: {
      father: { has: "NO" },
      mother: {
        has: "YES",
        details: { surname: "Dlamini", firstNames: "Nomsa", middleName: "", dateOfBirth: "1970-05-01", placeOfBirth: "Soweto" },
      },
    },
    residence: {
      status: "YES",
      address: { country: "South Africa", postalCode: "2001", city: "Johannesburg", street: "Main Street", building: "12", apartment: "" },
    },
    contact: { phones: ["+27 82 123 4567"], emails: ["Thabo@Example.com"] },
    work: {
      status: "YES",
      history: [{ organisation: "City College", role: "Engineering studies", address: "Johannesburg", from: "2021-01", to: "2023-12" }],
    },
  };
}

export function validDeclarations() {
  return { truthful: true, matchesDocuments: true, privacyNotice: true };
}
