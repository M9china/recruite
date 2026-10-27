import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { OpportunityList } from "@/components/sections/OpportunityList";
import { listCategories, listOpportunities } from "@/server/services/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Careers",
  description: "Browse roles by field, see what each involves and when applications close.",
};

export default async function CareersPage() {
  const now = new Date();
  const [categories, opportunities] = await Promise.all([listCategories(now), listOpportunities({ now })]);

  return (
    <>
      <PageHeader
        title="Careers"
        lede="Browse roles by field. Each role lists what you will do, what you need and when applications close."
        crumbs={[{ href: "/careers", label: "Careers" }]}
      />
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <nav aria-label="Career fields" className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-sans text-sm font-semibold text-stone-500">Fields</h2>
          <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/careers/${c.slug}`}
                  className="flex items-baseline justify-between gap-3 rounded-[var(--radius-control)] border border-stone-300 px-3 py-2 hover:border-forest-600 hover:text-forest-600 lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-3"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-stone-500">{c.openCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-labelledby="all-roles">
          <h2 id="all-roles" className="sr-only">
            All roles
          </h2>
          <p className="mb-6 text-stone-500">
            {opportunities.length} {opportunities.length === 1 ? "role" : "roles"}, open roles first
          </p>
          <OpportunityList opportunities={opportunities} now={now} />
        </section>
      </Container>
    </>
  );
}
