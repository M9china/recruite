import "server-only";
import { db } from "@/server/db";
import type { ContentRepository } from "./types";

/** Public content from PostgreSQL. Only publishable rows leave this module. */
export const prismaContentRepository: ContentRepository = {
  listCategories: () =>
    db.careerCategory.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, slug: true, description: true, displayOrder: true, published: true },
    }),

  listOpportunities: () =>
    db.careerOpportunity.findMany({
      where: { status: { in: ["OPEN", "CLOSED"] }, category: { published: true } },
      select: {
        id: true,
        categoryId: true,
        title: true,
        slug: true,
        summary: true,
        description: true,
        responsibilities: true,
        qualifications: true,
        eligibilityRequirements: true,
        applicationInstructions: true,
        status: true,
        applicationOpenAt: true,
        applicationCloseAt: true,
      },
    }),

  listAnnouncements: () =>
    db.recruitmentAnnouncement.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, summary: true, content: true, status: true, publishedAt: true, closingAt: true },
    }),

  listFaqs: () =>
    db.faq.findMany({
      where: { published: true },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
      select: { id: true, question: true, answer: true, category: true, displayOrder: true, published: true },
    }),

  listEligibility: () =>
    db.eligibilityCriterion.findMany({
      where: { published: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, group: true, title: true, body: true, displayOrder: true, published: true },
    }),
};
