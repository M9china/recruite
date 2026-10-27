import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextLink } from "@/components/ui/TextLink";
import { AnnouncementList } from "@/components/sections/AnnouncementList";
import { BenefitsBand } from "@/components/sections/BenefitsBand";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { ContactBand } from "@/components/sections/ContactBand";
import { Hero } from "@/components/sections/Hero";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { StatsBand } from "@/components/sections/StatsBand";
import { benefits, processSteps } from "@/content/recruitment";
import { site } from "@/content/site";
import {
  listActiveAnnouncements,
  listCategories,
  listEligibilityGroups,
  listFaqGroups,
} from "@/server/services/content";

// Open/closed labels depend on the date, so rebuild at least hourly.
export const revalidate = 3600;

export default async function HomePage() {
  const now = new Date();
  const [categories, announcements, eligibilityGroups, faqGroups] = await Promise.all([
    listCategories(now),
    listActiveAnnouncements(now),
    listEligibilityGroups(),
    listFaqGroups(),
  ]);
  const topFaqs = faqGroups.flatMap((g) => g.items).slice(0, 4);

  return (
    <>
      <Hero headline={site.hero.headline} lede={site.hero.lede} />
      <StatsBand stats={site.stats} />

      <section aria-labelledby="intro-title" className="py-20 md:py-28">
        <Container className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <h2 id="intro-title" className="text-5xl leading-[0.95] md:text-6xl">
            {site.intro.heading}
          </h2>
          <div>
            <p className="text-xl leading-relaxed text-charcoal-900 md:text-2xl">{site.intro.body}</p>
            <p className="mt-6">
              <TextLink href="/about">About the organisation</TextLink>
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="careers-title" className="pb-20 md:pb-28">
        <Container>
          <SectionHeading
            id="careers-title"
            title="Find your field"
            lede="Every role starts with training. Choose a field to see what is open and what each role involves."
            action={<TextLink href="/careers">View all roles</TextLink>}
          />
          <CategoryGrid categories={categories} />
        </Container>
      </section>

      <BenefitsBand benefits={benefits} />

      <section aria-labelledby="process-title" className="py-20 md:py-28">
        <Container>
          <SectionHeading
            id="process-title"
            title="How to apply"
            lede="Six steps from checking you qualify to hearing the outcome."
            action={<TextLink href="/process">The full process</TextLink>}
          />
          <ProcessSteps steps={processSteps} />
        </Container>
      </section>

      <section aria-labelledby="eligibility-title" className="bg-stone-100 py-20 md:py-28">
        <Container className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <h2 id="eligibility-title" className="text-4xl leading-none md:text-5xl">
              Who can apply
            </h2>
            <p className="mt-4 text-lg text-stone-500">
              Requirements are set for each intake. Check the general requirements here and the specific ones on each
              role.
            </p>
            <p className="mt-6">
              <TextLink href="/eligibility">Read the eligibility requirements</TextLink>
            </p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {eligibilityGroups.map((g) => (
              <li key={g.group} className="border-t border-stone-300 py-5">
                <h3 className="text-2xl">{g.group}</h3>
                <p className="mt-1 text-stone-500">{g.items.map((i) => i.title).join(", ")}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="announcements-title" className="py-20 md:py-28">
        <Container>
          <SectionHeading
            id="announcements-title"
            title="Announcements"
            lede="Official recruitment notices, with opening and closing dates."
            action={<TextLink href="/announcements">All announcements</TextLink>}
          />
          <AnnouncementList announcements={announcements} now={now} />
        </Container>
      </section>

      <section aria-labelledby="faq-title" className="pb-20 md:pb-28">
        <Container className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <h2 id="faq-title" className="text-4xl leading-none md:text-5xl">
              Common questions
            </h2>
            <p className="mt-6">
              <TextLink href="/faq">All questions</TextLink>
            </p>
          </div>
          <Accordion items={topFaqs} />
        </Container>
      </section>

      <ContactBand />
    </>
  );
}
