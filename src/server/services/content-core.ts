import type { Announcement, CareerCategory, CareerOpportunity, EligibilityCriterion, Faq } from "@/content/types";
import {
  type Availability,
  getAvailability,
  isAcceptingApplications,
  isAnnouncementActive,
} from "@/lib/domain/opportunity";
import type { ContentRepository } from "@/server/repositories/types";

/**
 * Public content rules, independent of where content is stored.
 * src/server/services/content.ts binds these to PostgreSQL; tests bind them
 * to in-memory data. All "what the public may see" rules live here.
 */

export type CategoryWithCounts = CareerCategory & { openCount: number };
export type OpportunityWithCategory = CareerOpportunity & { category: CareerCategory };
export type FaqGroup = { category: string; items: Faq[] };
export type EligibilityGroup = { group: string; items: EligibilityCriterion[] };

/** Applyable roles first, then upcoming, then closed. */
const AVAILABILITY_RANK: Record<Availability, number> = { CLOSING_SOON: 0, OPEN: 0, NOT_YET_OPEN: 1, CLOSED: 2 };

const byOrder = <T extends { displayOrder: number }>(a: T, b: T) => a.displayOrder - b.displayOrder;
const isPublic = (o: CareerOpportunity) => o.status === "OPEN" || o.status === "CLOSED";

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

export function createContentService(repo: ContentRepository) {
  async function publishedCategories() {
    return (await repo.listCategories()).filter((c) => c.published).sort(byOrder);
  }

  /** Public roles: OPEN (including upcoming and past-closing) and CLOSED, never DRAFT or ARCHIVED. */
  async function listOpportunities(options: { categoryId?: string; now?: Date } = {}): Promise<OpportunityWithCategory[]> {
    const now = options.now ?? new Date();
    const [categories, opportunities] = await Promise.all([publishedCategories(), repo.listOpportunities()]);
    const byId = new Map(categories.map((c) => [c.id, c]));
    return opportunities
      .filter((o) => isPublic(o) && byId.has(o.categoryId))
      .filter((o) => !options.categoryId || o.categoryId === options.categoryId)
      .map((o) => ({ ...o, category: byId.get(o.categoryId)! }))
      .sort((a, b) => {
        const rank = AVAILABILITY_RANK[getAvailability(a, now)] - AVAILABILITY_RANK[getAvailability(b, now)];
        if (rank !== 0) return rank;
        const ac = a.applicationCloseAt?.getTime() ?? Infinity;
        const bc = b.applicationCloseAt?.getTime() ?? Infinity;
        return ac - bc;
      });
  }

  async function listAnnouncements(now: Date = new Date()): Promise<Announcement[]> {
    return (await repo.listAnnouncements())
      .filter((a) => a.status === "PUBLISHED" && a.publishedAt !== null && a.publishedAt <= now)
      .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime());
  }

  return {
    async listCategories(now: Date = new Date()): Promise<CategoryWithCounts[]> {
      const [categories, opportunities] = await Promise.all([publishedCategories(), repo.listOpportunities()]);
      return categories.map((c) => ({
        ...c,
        openCount: opportunities.filter((o) => o.categoryId === c.id && isAcceptingApplications(o, now)).length,
      }));
    },

    async getCategory(slug: string): Promise<CareerCategory | null> {
      return (await publishedCategories()).find((c) => c.slug === slug) ?? null;
    },

    listOpportunities,

    /** Roles accepting applications right now, for the application form. */
    async listApplyableOpportunities(now: Date = new Date()): Promise<OpportunityWithCategory[]> {
      return (await listOpportunities({ now })).filter((o) => isAcceptingApplications(o, now));
    },

    async getOpportunity(categorySlug: string, slug: string): Promise<OpportunityWithCategory | null> {
      return (await listOpportunities()).find((o) => o.slug === slug && o.category.slug === categorySlug) ?? null;
    },

    listAnnouncements,

    async listActiveAnnouncements(now: Date = new Date(), limit = 3): Promise<Announcement[]> {
      return (await listAnnouncements(now)).filter((a) => isAnnouncementActive(a.closingAt, now)).slice(0, limit);
    },

    async getAnnouncement(slug: string, now: Date = new Date()): Promise<Announcement | null> {
      return (await listAnnouncements(now)).find((a) => a.slug === slug) ?? null;
    },

    async listFaqGroups(): Promise<FaqGroup[]> {
      const faqs = (await repo.listFaqs()).filter((f) => f.published).sort(byOrder);
      return groupBy(faqs, (f) => f.category).map(([category, items]) => ({ category, items }));
    },

    async listEligibilityGroups(): Promise<EligibilityGroup[]> {
      const items = (await repo.listEligibility()).filter((e) => e.published).sort(byOrder);
      return groupBy(items, (e) => e.group).map(([group, list]) => ({ group, items: list }));
    },
  };
}
