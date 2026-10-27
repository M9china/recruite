import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/validation/errors";
import { QuestionnaireSchema } from "@/lib/validation/questionnaire";
import { validQuestionnaire } from "../support/fakes";

function errorsFor(mutate: (q: ReturnType<typeof validQuestionnaire> & Record<string, any>) => void) {
  const q = validQuestionnaire() as ReturnType<typeof validQuestionnaire> & Record<string, any>;
  mutate(q);
  const r = QuestionnaireSchema.safeParse(q);
  return r.success ? {} : toFieldErrors(r.error.issues);
}

describe("questionnaire", () => {
  it("accepts a complete set of answers", () => {
    expect(errorsFor(() => undefined)).toEqual({});
  });

  it("asks for spouse details only when married, separated or in a civil partnership", () => {
    expect(Object.keys(errorsFor((q) => (q.personal.maritalStatus = "MARRIED")))).toEqual([
      "personal.spouse.birthCountry",
      "personal.spouse.birthCity",
      "personal.spouse.citizenship",
    ]);
    expect(errorsFor((q) => (q.personal.maritalStatus = "DIVORCED"))).toEqual({});
  });

  it("drops conditional details when the answer is no", () => {
    const q = validQuestionnaire() as any;
    q.parents.father.details = { surname: "Should not be stored" };
    q.residence = { status: "NONE", address: { country: "Should not be stored" } };
    q.work = { status: "NEVER", history: [{ organisation: "Should not be stored" }] };
    const out = QuestionnaireSchema.parse(q);
    expect(out.parents.father).toEqual({ has: "NO", details: undefined });
    expect(out.residence).toEqual({ status: "NONE", address: undefined });
    expect(out.work).toEqual({ status: "NEVER", history: undefined });
  });

  it("requires parent details when the answer is yes", () => {
    const errors = errorsFor((q) => (q.parents.father = { has: "YES", details: { surname: "M" } }));
    expect(Object.keys(errors)).toEqual([
      "parents.father.details.firstNames",
      "parents.father.details.dateOfBirth",
      "parents.father.details.placeOfBirth",
    ]);
  });

  it("checks dates are real and in the past", () => {
    const bad = (dateOfBirth: string) =>
      errorsFor((q) => (q.parents.mother.details!.dateOfBirth = dateOfBirth))["parents.mother.details.dateOfBirth"];
    expect(bad("1970-02-30")).toEqual(["Enter a real date"]);
    expect(bad("2999-01-01")).toEqual(["The date must be in the past"]);
    expect(bad("30/01/1970")).toEqual(["Enter a real date"]);
  });

  it("requires the full address when the applicant has a residence", () => {
    const errors = errorsFor((q) => (q.residence.address = { country: "South Africa" } as any));
    expect(Object.keys(errors)).toEqual([
      "residence.address.postalCode",
      "residence.address.city",
      "residence.address.street",
      "residence.address.building",
    ]);
  });

  it("validates every phone number and email address", () => {
    const errors = errorsFor((q) => {
      q.contact.phones = ["+27 82 123 4567", "call me"];
      q.contact.emails = ["ok@example.com", "not-an-email"];
    });
    expect(Object.keys(errors)).toEqual(["contact.phones.1", "contact.emails.1"]);
    expect(Object.keys(errorsFor((q) => (q.contact.emails = [])))).toEqual(["contact.emails"]);
  });

  it("requires employment or education history when the answer is yes", () => {
    expect(errorsFor((q) => (q.work.history = []))).toEqual({
      "work.history": ["Add at least one place of employment or education"],
    });
    expect(errorsFor((q) => (q.work.history[0]!.to = "2020-01"))["work.history.0.to"]).toEqual([
      "The end month must be after the start month",
    ]);
  });
});
