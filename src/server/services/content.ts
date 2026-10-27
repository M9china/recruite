import "server-only";
import { categories, opportunities } from "@/content/careers";
import { announcements, eligibility, faqs } from "@/content/recruitment";
import type { Announcement, CareerCategory, CareerOpportunity, EligibilityCriterion, Faq } from "@/content/types";
import {
  type Availability,
  getAvailability,
  isAcceptingApplications,
  isAnnouncementActive,
} from "@/lib/domain/opportunity";

/** Applyable roles first, then upcoming, then closed. */
const AVAILABILITY_RANK: Record<Availability, number> = { CLOSING_SOON: 0, OPEN: 0, NOT_YET_OPEN: 1, CLOSED: 2 };

/**
 * Public content service. Pages call only these functions.
 *
 * Milestone 2: reads typed draft content from src/content.
 * Milestone 3: the same signatures read from src/server/repositories (Prisma);
 * pages do not change. All "published only" rules live here, not in pages.
 */

const byOrder = <T extends { displayOrder: number }>(a: T, b: T) => a.displayOrder - b.displayOrder;
const isPublic = (o: CareerOpportunity) => o.status === "OPEN" || o.status === "CLOSED";

export type CategoryWithCounts = CareerCategory & { openCount: number };

export async function listCategories(now: Date = new Date()): Promise<CategoryWithCounts[]> {
  return categories
    .filter((c) => c.published)
    .sort(byOrder)
    .map((c) => ({
      ...c,
      openCount: opportunities.filter((o) => o.categoryId === c.id && isAcceptingApplications(o, now)).length,
    }));
}

export async function getCategory(slug: string): Promise<CareerCategory | null> {
  return categories.find((c) => c.slug === slug && c.published) ?? null;
}

export type OpportunityWithCategory = CareerOpportunity & { category: CareerCategory };

/**
 * Public opportunities: OPEN (including not-yet-open and past-closing) and CLOSED.
 * DRAFT and ARCHIVED never appear. Sorted by availability, then by closing date.
 */
export async function listOpportunities(
  options: { categoryId?: string; now?: Date } = {},
): Promise<OpportunityWithCategory[]> {
  const now = options.now ?? new Date();
  const published = new Map(categories.filter((c) => c.published).map((c) => [c.id, c]));
  return opportunities
    .filter((o) => isPublic(o) && published.has(o.categoryId))
    .filter((o) => !options.categoryId || o.categoryId === options.categoryId)
    .map((o) => ({ ...o, category: published.get(o.categoryId)! }))
    .sort((a, b) => {
      const rank = AVAILABILITY_RANK[getAvailability(a, now)] - AVAILABILITY_RANK[getAvailability(b, now)];
      if (rank !== 0) return rank;
      const ac = a.applicationCloseAt?.getTime() ?? Infinity;
      const bc = b.applicationCloseAt?.getTime() ?? Infinity;
      return ac - bc;
    });
}

export async function getOpportunity(categorySlug: string, slug: string): Promise<OpportunityWithCategory | null> {
  const all = await listOpportunities();
  return all.find((o) => o.slug === slug && o.category.slug === categorySlug) ?? null;
}

/** Published announcements, newest first. Callers use isAnnouncementActive to label them. */
export async function listAnnouncements(now: Date = new Date()): Promise<Announcement[]> {
  return announcements
    .filter((a) => a.status === "PUBLISHED" && a.publishedAt !== null && a.publishedAt <= now)
    .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());
}

export async function listActiveAnnouncements(now: Date = new Date(), limit = 3): Promise<Announcement[]> {
  return (await listAnnouncements(now)).filter((a) => isAnnouncementActive(a.closingAt, now)).slice(0, limit);
}

export async function getAnnouncement(slug: string, now: Date = new Date()): Promise<Announcement | null> {
  return (await listAnnouncements(now)).find((a) => a.slug === slug) ?? null;
}

export type FaqGroup = { category: string; items: Faq[] };

export async function listFaqGroups(): Promise<FaqGroup[]> {
  return groupBy(faqs.filter((f) => f.published).sort(byOrder), (f) => f.category).map(([category, items]) => ({
    category,
    items,
  }));
}

export type EligibilityGroup = { group: string; items: EligibilityCriterion[] };

export async function listEligibilityGroups(): Promise<EligibilityGroup[]> {
  return groupBy(eligibility.filter((e) => e.published).sort(byOrder), (e) => e.group).map(([group, items]) => ({
    group,
    items,
  }));
}

/** Groups preserving first-seen order. */
function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return [...map.entries()];
}
