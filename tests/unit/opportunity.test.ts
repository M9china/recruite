import { describe, expect, it } from "vitest";
import {
  getAvailability,
  isAcceptingApplications,
  isAnnouncementActive,
  type OpportunityWindow,
} from "@/lib/domain/opportunity";

const now = new Date("2026-10-27T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const open = (o: Partial<OpportunityWindow> = {}): OpportunityWindow => ({
  status: "OPEN",
  applicationOpenAt: days(-10),
  applicationCloseAt: days(30),
  ...o,
});

describe("isAcceptingApplications", () => {
  it("accepts inside the window", () => {
    expect(isAcceptingApplications(open(), now)).toBe(true);
  });

  it("accepts when no dates are set", () => {
    expect(isAcceptingApplications(open({ applicationOpenAt: null, applicationCloseAt: null }), now)).toBe(true);
  });

  it.each(["DRAFT", "CLOSED", "ARCHIVED"] as const)("rejects status %s even inside the window", (status) => {
    expect(isAcceptingApplications(open({ status }), now)).toBe(false);
  });

  it("rejects before opening", () => {
    expect(isAcceptingApplications(open({ applicationOpenAt: days(1) }), now)).toBe(false);
  });

  it("rejects exactly at the closing instant", () => {
    expect(isAcceptingApplications(open({ applicationCloseAt: now }), now)).toBe(false);
  });
});

describe("getAvailability", () => {
  it("is CLOSING_SOON within 7 days of closing", () => {
    expect(getAvailability(open({ applicationCloseAt: days(3) }), now)).toBe("CLOSING_SOON");
  });

  it("is NOT_YET_OPEN before the opening date", () => {
    expect(getAvailability(open({ applicationOpenAt: days(2) }), now)).toBe("NOT_YET_OPEN");
  });

  it("is CLOSED after the closing date even if status is still OPEN", () => {
    expect(getAvailability(open({ applicationCloseAt: days(-1) }), now)).toBe("CLOSED");
  });

  it("agrees with isAcceptingApplications", () => {
    const cases = [open(), open({ applicationCloseAt: days(2) }), open({ applicationCloseAt: days(-1) }), open({ status: "CLOSED" })];
    for (const c of cases) {
      const shownAsApplyable = ["OPEN", "CLOSING_SOON"].includes(getAvailability(c, now));
      expect(shownAsApplyable).toBe(isAcceptingApplications(c, now));
    }
  });
});

describe("isAnnouncementActive", () => {
  it("is inactive after closing", () => {
    expect(isAnnouncementActive(days(-1), now)).toBe(false);
  });
  it("is active with no closing date", () => {
    expect(isAnnouncementActive(null, now)).toBe(true);
  });
});
