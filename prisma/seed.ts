/**
 * Development seed. Loads the clearly-marked DRAFT content in prisma/seed-data
 * so the site and application form work before the client supplies approved
 * material. Re-running updates existing rows to match the seed files.
 *
 * Guard rails: refuses to run in production, and only runs when
 * SEED_SAMPLE_CONTENT=true. Nothing here is official policy.
 */
import { PrismaClient } from "@prisma/client";
import { categories, opportunities } from "./seed-data/careers";
import { announcements, eligibility, faqs } from "./seed-data/records";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed sample content in production.");
  }
  if (process.env.SEED_SAMPLE_CONTENT !== "true") {
    console.log("Skipping seed: set SEED_SAMPLE_CONTENT=true to insert draft content.");
    return;
  }

  const db = new PrismaClient();
  try {
    for (const c of categories) {
      // `image` is display-only and not stored in the database.
      const data = { id: c.id, name: c.name, slug: c.slug, description: c.description, displayOrder: c.displayOrder, published: c.published };
      await db.careerCategory.upsert({ where: { id: c.id }, create: data, update: data });
    }
    for (const o of opportunities) {
      await db.careerOpportunity.upsert({ where: { id: o.id }, create: o, update: o });
    }
    for (const e of eligibility) {
      await db.eligibilityCriterion.upsert({ where: { id: e.id }, create: e, update: e });
    }
    for (const f of faqs) {
      await db.faq.upsert({ where: { id: f.id }, create: f, update: f });
    }
    for (const a of announcements) {
      await db.recruitmentAnnouncement.upsert({ where: { id: a.id }, create: a, update: a });
    }
    console.log(
      `Seeded ${categories.length} categories, ${opportunities.length} roles, ${eligibility.length} eligibility items, ` +
        `${faqs.length} FAQs, ${announcements.length} announcements.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
