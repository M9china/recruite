/**
 * Rules for when an opportunity accepts applications and how its availability
 * is shown. Used by both the public pages and the submit service, so the UI
 * can never advertise something the server would reject.
 */
export type OpportunityWindow = {
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  applicationOpenAt: Date | null;
  applicationCloseAt: Date | null;
};

export type Availability = "OPEN" | "CLOSING_SOON" | "NOT_YET_OPEN" | "CLOSED";

export const CLOSING_SOON_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Server-authoritative: true only if an application submitted at `now` may be accepted. */
export function isAcceptingApplications(opp: OpportunityWindow, now: Date = new Date()): boolean {
  if (opp.status !== "OPEN") return false;
  if (opp.applicationOpenAt && now < opp.applicationOpenAt) return false;
  if (opp.applicationCloseAt && now >= opp.applicationCloseAt) return false;
  return true;
}

export function getAvailability(opp: OpportunityWindow, now: Date = new Date()): Availability {
  if (opp.status !== "OPEN") return "CLOSED";
  if (opp.applicationOpenAt && now < opp.applicationOpenAt) return "NOT_YET_OPEN";
  if (opp.applicationCloseAt) {
    if (now >= opp.applicationCloseAt) return "CLOSED";
    if (opp.applicationCloseAt.getTime() - now.getTime() <= CLOSING_SOON_DAYS * DAY_MS) {
      return "CLOSING_SOON";
    }
  }
  return "OPEN";
}

/** Announcements past their closing date must never read as active. */
export function isAnnouncementActive(closingAt: Date | null, now: Date = new Date()): boolean {
  return closingAt === null || now < closingAt;
}
