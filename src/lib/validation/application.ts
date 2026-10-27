import { z } from "zod";
import { MAX_DOCUMENTS_PER_APPLICATION } from "@/lib/domain/documents";
import { DeclarationsSchema, QuestionnaireSchema } from "./questionnaire";

/** Body of POST /api/public/v1/applications. */
export const SubmissionSchema = z.object({
  opportunitySlug: z.string({ error: "Choose a role" }).trim().min(1, "Choose a role").max(120),
  questionnaire: QuestionnaireSchema,
  declarations: DeclarationsSchema,
  /** Secret tokens returned by the upload endpoint, one per uploaded file. */
  documentTokens: z
    .array(z.string().regex(/^[A-Za-z0-9_-]{43}$/, "A document reference is invalid. Upload the file again."))
    .max(MAX_DOCUMENTS_PER_APPLICATION, `Upload up to ${MAX_DOCUMENTS_PER_APPLICATION} documents`)
    .default([]),
  /** Generated once per form session; makes retries and double-clicks safe. */
  idempotencyKey: z.uuid("The form session is invalid. Reload the page and try again."),
});

export type Submission = z.output<typeof SubmissionSchema>;

/** Body of a successful submission response. */
export type SubmissionResult = { referenceNumber: string };
