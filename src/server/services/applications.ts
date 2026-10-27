import { isAcceptingApplications } from "@/lib/domain/opportunity";
import { generateReference } from "@/lib/domain/reference";
import { AppError } from "@/lib/errors";
import { type SubmissionResult, SubmissionSchema } from "@/lib/validation/application";
import { toFieldErrors } from "@/lib/validation/errors";
import { QUESTIONNAIRE_VERSION } from "@/lib/validation/questionnaire";
import { PRIVACY_NOTICE_VERSION } from "@/content/legal";
import {
  type ApplicationRepository,
  DocumentsUnavailable,
  UniqueConflict,
} from "@/server/repositories/types";
import { hashToken } from "@/server/security/tokens";

/** Uploads must be attached to an application within this time. */
export const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REFERENCE_ATTEMPTS = 3;

export type SubmitDeps = {
  repo: ApplicationRepository;
  now?: Date;
  newReference?: (now: Date) => string;
};

const documentsError = (message: string) =>
  new AppError("VALIDATION_FAILED", message, { fieldErrors: { documents: [message] } });

/**
 * Validates and saves an application. Nothing is reported as submitted unless
 * the database transaction commits. Safe to retry with the same idempotency key.
 */
export async function submitApplication(body: unknown, deps: SubmitDeps): Promise<SubmissionResult> {
  const now = deps.now ?? new Date();
  const newReference = deps.newReference ?? generateReference;

  // 1. Validate everything on the server, whatever the browser checked.
  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("VALIDATION_FAILED", "Some answers need correcting.", {
      fieldErrors: toFieldErrors(parsed.error.issues),
    });
  }
  const input = parsed.data;

  // 2. A retry of a submission that already succeeded gets the same reference.
  const previous = await deps.repo.findReferenceByIdempotencyKey(input.idempotencyKey);
  if (previous) return { referenceNumber: previous };

  // 3. The role must exist and be open now.
  const opportunity = await deps.repo.findOpportunityBySlug(input.opportunitySlug);
  if (!opportunity) {
    throw new AppError("VALIDATION_FAILED", "Choose a role from the list.", {
      fieldErrors: { opportunitySlug: ["Choose a role from the list"] },
    });
  }
  if (!isAcceptingApplications(opportunity, now)) {
    throw new AppError("OPPORTUNITY_CLOSED", "Applications for this role are closed.");
  }

  // 4. Every document token must match a recent, unattached upload; one photo is required.
  const hashes = [...new Set(input.documentTokens)].map(hashToken);
  const found = hashes.length > 0 ? await deps.repo.findPendingDocuments(hashes) : [];
  const usable = found.filter((d) => now.getTime() - d.createdAt.getTime() <= UPLOAD_TTL_MS);
  if (usable.length !== hashes.length) {
    throw documentsError("One or more uploaded files have expired or could not be found. Upload them again.");
  }
  const photos = usable.filter((d) => d.documentType === "PHOTO").length;
  if (photos === 0) throw documentsError("Upload your photo");
  if (photos > 1) throw documentsError("Upload one photo only");

  // 5. Save in one transaction; retry only on the rare reference collision.
  const q = input.questionnaire;
  const primaryEmail = q.contact.emails[0]!;
  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt++) {
    const referenceNumber = newReference(now);
    try {
      await deps.repo.createApplication({
        referenceNumber,
        idempotencyKey: input.idempotencyKey,
        opportunityId: opportunity.id,
        applicant: {
          firstName: q.personal.firstName,
          lastName: q.personal.surname,
          email: primaryEmail,
          phone: q.contact.phones[0]!,
        },
        questionnaire: q,
        formVersion: QUESTIONNAIRE_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        consentedAt: now,
        submittedAt: now,
        documentIds: usable.map((d) => d.id),
        outbox: {
          template: "application_received",
          toEmail: primaryEmail,
          payload: { referenceNumber, firstName: q.personal.firstName, roleTitle: opportunity.title },
        },
      });
      return { referenceNumber };
    } catch (err) {
      if (err instanceof UniqueConflict) {
        if (err.target === "referenceNumber") continue;
        if (err.target === "idempotencyKey") {
          // A concurrent duplicate request won the race; return its reference.
          const winner = await deps.repo.findReferenceByIdempotencyKey(input.idempotencyKey);
          if (winner) return { referenceNumber: winner };
        }
        if (err.target === "applicantOpportunity") {
          throw new AppError(
            "DUPLICATE_APPLICATION",
            "An application for this role has already been received from this email address. You do not need to apply again.",
          );
        }
      }
      if (err instanceof DocumentsUnavailable) {
        throw documentsError("One or more uploaded files are no longer available. Upload them again.");
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique reference number");
}
