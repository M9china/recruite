import { describe, expect, it } from "vitest";
import { createContentService } from "@/server/services/content-core";
import { seedContentRepository } from "../support/fakes";

const now = new Date("2026-10-27T12:00:00+02:00");
const {
  getOpportunity,
  listActiveAnnouncements,
  listAnnouncements,
  listApplyableOpportunities,
  listCategories,
  listOpportunities,
} = createContentService(seedContentRepository);

describe("content service", () => {
  it("orders roles: applyable first, then upcoming, then closed", async () => {
    const slugs = (await listOpportunities({ now })).map((o) => o.slug);
    expect(slugs).toEqual([
      "vehicle-technician-trainee",
      "supply-chain-clerk",
      "field-operations-recruit",
      "health-care-assistant",
      "network-support-technician",
    ]);
  });

  it("offers only roles accepting applications on the form", async () => {
    const slugs = (await listApplyableOpportunities(now)).map((o) => o.slug);
    expect(slugs).toEqual(["vehicle-technician-trainee", "supply-chain-clerk", "field-operations-recruit"]);
  });

  it("counts only roles accepting applications per category", async () => {
    const counts = Object.fromEntries((await listCategories(now)).map((c) => [c.slug, c.openCount]));
    expect(counts).toEqual({
      "field-operations": 1,
      "engineering-technical": 1,
      "logistics-supply": 1,
      "health-services": 0,
      "communications-it": 0,
    });
  });

  it("only finds a role under its own category", async () => {
    expect(await getOpportunity("field-operations", "field-operations-recruit")).not.toBe(null);
    expect(await getOpportunity("health-services", "field-operations-recruit")).toBe(null);
  });

  it("never lists closed announcements as active", async () => {
    const active = (await listActiveAnnouncements(now)).map((a) => a.slug);
    expect(active).toEqual(["sample-intake-open"]);
    expect((await listAnnouncements(now)).map((a) => a.slug)).toEqual(["sample-intake-open", "sample-intake-closed"]);
  });

  it("hides announcements scheduled for the future", async () => {
    const before = new Date("2026-08-01T00:00:00+02:00");
    expect((await listAnnouncements(before)).map((a) => a.slug)).toEqual(["sample-intake-closed"]);
  });
});
