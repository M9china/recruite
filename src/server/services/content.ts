import "server-only";
import { prismaContentRepository } from "@/server/repositories/prisma-content";
import { createContentService } from "./content-core";

/** Public content service bound to PostgreSQL. Pages import from here. */
export type {
  CategoryWithCounts,
  EligibilityGroup,
  FaqGroup,
  OpportunityWithCategory,
} from "./content-core";

export const {
  listCategories,
  getCategory,
  listOpportunities,
  listApplyableOpportunities,
  getOpportunity,
  listAnnouncements,
  listActiveAnnouncements,
  getAnnouncement,
  listFaqGroups,
  listEligibilityGroups,
} = createContentService(prismaContentRepository);
