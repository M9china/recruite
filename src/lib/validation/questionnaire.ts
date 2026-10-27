import { z } from "zod";

/**
 * Applicant questionnaire, version 1. Used by the form (step by step) and by
 * the server (whole). Stored as JSON on the application together with
 * QUESTIONNAIRE_VERSION, so later versions can change fields without
 * rewriting old applications.
 *
 * Conditional questions ("If yes, please provide…") are validated only when
 * they apply, and the details are dropped from the stored answer when they do not.
 */
export const QUESTIONNAIRE_VERSION = 1;

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

const text = (message: string, max = 100) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(max, `Use ${max} characters or fewer`);

const optionalText = (max = 100) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer`)
    .optional()
    .transform((v) => (v ? v : undefined));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const pastDate = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .regex(ISO_DATE, "Enter a real date")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), "Enter a real date")
    .refine((v) => v >= "1900-01-01", "Enter a date after 1900")
    .refine((v) => v <= todayIso(), "The date must be in the past");

const month = (message: string) =>
  z.string({ error: message }).trim().min(1, message).regex(ISO_MONTH, "Enter the month as YYYY-MM");

/**
 * Validates `schema` only when a condition holds, reporting issues under `path`.
 * Zod 4 still runs a following .transform() when a refinement adds issues, so
 * transforms use `parsed()` below, which tolerates invalid input (the parse has
 * already failed and its output is discarded).
 */
function checkWhen(schema: z.ZodType, value: unknown, ctx: z.RefinementCtx, path: (string | number)[]) {
  const result = schema.safeParse(value ?? {});
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: "custom", message: issue.message, path: [...path, ...issue.path] });
    }
  }
}

function parsed<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  return schema.safeParse(value ?? {}).data as z.output<T>;
}

// ---------------------------------------------------------------------------
// Questions 1–3, 6–7: personal details
// ---------------------------------------------------------------------------

export const MARITAL_STATUS_LABELS = {
  MARRIED: "Married",
  NEVER_MARRIED: "Never married",
  DIVORCED: "Divorced",
  SEPARATED: "Separated",
  WIDOWED: "Widowed",
  CIVIL_PARTNERSHIP: "Civil partnership",
  CIVIL_PARTNERSHIP_ENDED: "Terminated civil partnership",
} as const;
export type MaritalStatus = keyof typeof MARITAL_STATUS_LABELS;
const MARITAL_STATUSES = Object.keys(MARITAL_STATUS_LABELS) as [MaritalStatus, ...MaritalStatus[]];

/** Statuses with a current spouse or partner, for whom questions 6 and 7 apply. */
export const HAS_SPOUSE: ReadonlySet<MaritalStatus> = new Set(["MARRIED", "SEPARATED", "CIVIL_PARTNERSHIP"]);

export const SpouseSchema = z.object({
  birthCountry: text("Enter the country where your spouse or partner was born", 80),
  birthCity: text("Enter the town or city where your spouse or partner was born", 120),
  citizenship: text("Enter your spouse or partner's citizenship", 80),
});

export const PersonalSchema = z
  .object({
    surname: text("Enter your surname"),
    firstName: text("Enter your first name"),
    middleName: optionalText(),
    maritalStatus: z.enum(MARITAL_STATUSES, { error: "Select your marital status" }),
    spouse: z.unknown().optional(),
  })
  .superRefine((v, ctx) => {
    if (HAS_SPOUSE.has(v.maritalStatus)) checkWhen(SpouseSchema, v.spouse, ctx, ["spouse"]);
  })
  .transform(({ spouse, ...rest }) => ({
    ...rest,
    spouse: HAS_SPOUSE.has(rest.maritalStatus) ? parsed(SpouseSchema, spouse) : undefined,
  }));

// ---------------------------------------------------------------------------
// Questions 4–5: parents
// ---------------------------------------------------------------------------

const yesNo = z.enum(["YES", "NO"], { error: "Select yes or no" });

export const ParentDetailsSchema = z.object({
  surname: text("Enter their surname"),
  firstNames: text("Enter their first name or names", 120),
  middleName: optionalText(),
  dateOfBirth: pastDate("Enter their date of birth"),
  placeOfBirth: text("Enter their place of birth", 120),
});

const ParentSchema = z
  .object({ has: yesNo, details: z.unknown().optional() })
  .superRefine((v, ctx) => {
    if (v.has === "YES") checkWhen(ParentDetailsSchema, v.details, ctx, ["details"]);
  })
  .transform((v) => ({ has: v.has, details: v.has === "YES" ? parsed(ParentDetailsSchema, v.details) : undefined }));

export const ParentsSchema = z.object({ father: ParentSchema, mother: ParentSchema });

// ---------------------------------------------------------------------------
// Question 8: residence
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  country: text("Enter the country", 80),
  postalCode: text("Enter the postal code", 12),
  city: text("Enter the city or town", 120),
  street: text("Enter the street", 150),
  building: text("Enter the house or building number", 40),
  apartment: optionalText(40),
});

export const ResidenceSchema = z
  .object({
    status: z.enum(["YES", "NONE"], { error: "Select an answer" }),
    address: z.unknown().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "YES") checkWhen(AddressSchema, v.address, ctx, ["address"]);
  })
  .transform((v) => ({ status: v.status, address: v.status === "YES" ? parsed(AddressSchema, v.address) : undefined }));

// ---------------------------------------------------------------------------
// Questions 9–10: contact
// ---------------------------------------------------------------------------

export const MAX_PHONES = 5;
export const MAX_EMAILS = 3;

const phone = z
  .string()
  .trim()
  .min(1, "Enter a phone number")
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number using digits, for example +27 82 123 4567")
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a full phone number")
  .transform((v) => v.replace(/\s+/g, " "));

const email = z
  .string()
  .trim()
  .min(1, "Enter an email address")
  .max(254, "Use 254 characters or fewer")
  .pipe(z.email("Enter an email address in the format name@example.com"))
  .transform((v) => v.toLowerCase());

export const ContactSchema = z.object({
  phones: z.array(phone).min(1, "Enter at least one phone number").max(MAX_PHONES, `Enter up to ${MAX_PHONES} phone numbers`),
  emails: z
    .array(email)
    .min(1, "Enter at least one email address")
    .max(MAX_EMAILS, `Enter up to ${MAX_EMAILS} email addresses`)
    .refine((list) => new Set(list).size === list.length, "Each email address should be entered only once"),
});

// ---------------------------------------------------------------------------
// Question 11: work and education
// ---------------------------------------------------------------------------

export const WORK_STATUS_LABELS = {
  YES: "Yes",
  NO: "No",
  NEVER: "I do not work/have never worked and do not study/have never studied",
} as const;
export type WorkStatus = keyof typeof WORK_STATUS_LABELS;

export const MAX_HISTORY_ENTRIES = 5;

export const HistoryEntrySchema = z
  .object({
    organisation: text("Enter the organisation name", 150),
    role: text("Enter the position or field of study", 120),
    address: text("Enter the address", 200),
    from: month("Enter the start month"),
    to: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().regex(ISO_MONTH, "Enter the month as YYYY-MM").optional()),
  })
  .superRefine((v, ctx) => {
    const thisMonth = todayIso().slice(0, 7);
    if (v.from > thisMonth) ctx.addIssue({ code: "custom", path: ["from"], message: "The start month cannot be in the future" });
    if (v.to && v.to < v.from) ctx.addIssue({ code: "custom", path: ["to"], message: "The end month must be after the start month" });
    if (v.to && v.to > thisMonth) ctx.addIssue({ code: "custom", path: ["to"], message: "Leave the end month blank if you are still there" });
  });

const HistoryListSchema = z
  .array(HistoryEntrySchema)
  .min(1, "Add at least one place of employment or education")
  .max(MAX_HISTORY_ENTRIES, `Add up to ${MAX_HISTORY_ENTRIES} places`);

export const WorkSchema = z
  .object({
    status: z.enum(["YES", "NO", "NEVER"], { error: "Select an answer" }),
    history: z.unknown().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "YES") checkWhen(HistoryListSchema, v.history, ctx, ["history"]);
  })
  .transform((v) => ({ status: v.status, history: v.status === "YES" ? parsed(HistoryListSchema, v.history) : undefined }));

// ---------------------------------------------------------------------------
// Whole questionnaire and declarations
// ---------------------------------------------------------------------------

export const QuestionnaireSchema = z.object({
  personal: PersonalSchema,
  parents: ParentsSchema,
  residence: ResidenceSchema,
  contact: ContactSchema,
  work: WorkSchema,
});

export type Questionnaire = z.output<typeof QuestionnaireSchema>;
export type QuestionnaireInput = z.input<typeof QuestionnaireSchema>;
export type QuestionnaireSection = keyof Questionnaire;

export const DeclarationsSchema = z.object({
  truthful: z.literal(true, { error: "Confirm that your answers are true and complete" }),
  matchesDocuments: z.literal(true, { error: "Confirm that your answers match your documents" }),
  privacyNotice: z.literal(true, { error: "Confirm that you have read the data-processing notice" }),
});

export type Declarations = z.output<typeof DeclarationsSchema>;
