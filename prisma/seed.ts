/**
 * Development seed. Inserts clearly-labelled SAMPLE content so pages can be
 * built and tested before the client supplies approved material.
 *
 * Guard rails: refuses to run in production, and only runs when
 * SEED_SAMPLE_CONTENT=true. Nothing here is official policy.
 */
import { PrismaClient } from "@prisma/client";

const SAMPLE = "SAMPLE — replace with client-approved content.";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed sample content in production.");
  }
  if (process.env.SEED_SAMPLE_CONTENT !== "true") {
    console.log("Skipping seed: set SEED_SAMPLE_CONTENT=true to insert sample content.");
    return;
  }

  const db = new PrismaClient();
  try {
    const category = await db.careerCategory.upsert({
      where: { slug: "sample-technical" },
      update: {},
      create: {
        name: "Sample Technical Category",
        slug: "sample-technical",
        description: SAMPLE,
        displayOrder: 1,
        published: true,
      },
    });

    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.careerOpportunity.upsert({
      where: { slug: "sample-opportunity" },
      update: {},
      create: {
        categoryId: category.id,
        title: "Sample Opportunity",
        slug: "sample-opportunity",
        summary: SAMPLE,
        description: SAMPLE,
        responsibilities: [SAMPLE],
        qualifications: [SAMPLE],
        eligibilityRequirements: [SAMPLE],
        applicationInstructions: SAMPLE,
        status: "OPEN",
        applicationOpenAt: new Date(),
        applicationCloseAt: in30Days,
      },
    });

    await db.faq.upsert({
      where: { id: "sample-faq-1" },
      update: {},
      create: {
        id: "sample-faq-1",
        question: "Sample question?",
        answer: SAMPLE,
        category: "General",
        displayOrder: 1,
        published: true,
      },
    });

    await db.recruitmentAnnouncement.upsert({
      where: { slug: "sample-announcement" },
      update: {},
      create: {
        title: "Sample Announcement",
        slug: "sample-announcement",
        summary: SAMPLE,
        content: SAMPLE,
        status: "PUBLISHED",
        publishedAt: new Date(),
        closingAt: in30Days,
      },
    });

    await db.eligibilityCriterion.upsert({
      where: { id: "sample-eligibility-1" },
      update: {},
      create: {
        id: "sample-eligibility-1",
        group: "GENERAL",
        title: "Sample criterion",
        body: SAMPLE,
        displayOrder: 1,
        published: true,
      },
    });

    console.log("Seeded sample content.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
