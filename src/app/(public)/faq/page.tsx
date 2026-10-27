import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { listFaqGroups } from "@/server/services/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about applying, eligibility and what happens next.",
};

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default async function FaqPage() {
  const groups = await listFaqGroups();
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        crumbs={[{ href: "/faq", label: "FAQ" }]}
        lede="Answers about applying, eligibility and what happens after you apply."
      />
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <nav aria-label="Question topics" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:flex-col">
            {groups.map((g) => (
              <li key={g.category}>
                <a href={`#${anchor(g.category)}`} className="font-medium hover:text-forest-600 hover:underline hover:underline-offset-4">
                  {g.category}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.category} aria-labelledby={anchor(g.category)}>
              <h2 id={anchor(g.category)} className="mb-4 text-4xl">
                {g.category}
              </h2>
              <Accordion items={g.items} />
            </section>
          ))}
          <p className="text-stone-500">
            Question not answered here? <TextLink href="/contact">Contact the recruitment office</TextLink>.
          </p>
        </div>
      </Container>
    </>
  );
}
