import { describe, expect, it } from "vitest";
import { AppError, toErrorResponse } from "@/lib/errors";
import { REDACTED, redact } from "@/server/logging/redact";
import { canTransition, INITIAL_APPLICATION_STATUS } from "@/lib/domain/application-status";

describe("toErrorResponse", () => {
  it("maps AppError to its status and safe message", () => {
    const { status, body } = toErrorResponse(new AppError("OPPORTUNITY_CLOSED", "Applications are closed."), "req-1");
    expect(status).toBe(409);
    expect(body.error).toEqual({ code: "OPPORTUNITY_CLOSED", message: "Applications are closed.", requestId: "req-1" });
  });

  it("hides internal errors behind a generic message", () => {
    const leak = new Error('duplicate key value violates unique constraint "Applicant_email_key"');
    const { status, body } = toErrorResponse(leak, "req-2");
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("Applicant_email_key");
  });
});

describe("redact", () => {
  it("removes personal data at any depth, case-insensitively", () => {
    const out = redact({
      requestId: "r1",
      applicant: { Email: "a@b.co", phone: "0821234567", firstName: "Thabo" },
      list: [{ password: "x" }],
    });
    expect(out).toEqual({
      requestId: "r1",
      applicant: { Email: REDACTED, phone: REDACTED, firstName: REDACTED },
      list: [{ password: REDACTED }],
    });
  });
});

describe("application status model", () => {
  it("starts at SUBMITTED", () => {
    expect(INITIAL_APPLICATION_STATUS).toBe("SUBMITTED");
  });
  it("does not allow leaving a terminal status", () => {
    expect(canTransition("ACCEPTED", "UNDER_REVIEW")).toBe(false);
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });
});
