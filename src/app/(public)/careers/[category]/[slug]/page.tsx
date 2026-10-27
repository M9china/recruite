import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvailabilityTag } from "@/components/ui/AvailabilityTag";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { getAvailability, isAcceptingApplications } from "@/lib/domain/opportunity";
import { formatDate, isoDate, paragraphs } from "@/lib/format";
import { getOpportunity, listOpportunities } from "@/server/services/content";

export const revalidate = 3600;

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  return (await listOpportunities()).map((o) => ({ category: o.category.slug, slug: o.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, slug } = await params;
  const o = await getOpportunity(category, slug);
  return o ? { title: o.title, description: o.summary } : {};
}

function ListSection({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <section aria-labelledby={id} className="border-t border-stone-300 pt-8">
      <h2 id={id} className="text-3xl">
        {title}
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 bg-forest-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function OpportunityPage({ params }: Params) {
  const { category, slug } = await params;
  const o = await getOpportunity(category, slug);
  if (!o) notFound();

  const now = new Date();
  const availability = getAvailability(o, now);
  const accepting = isAcceptingApplications(o, now);

  return (
    <>
      <PageHeader
        title={o.title}
        lede={o.summary}
        crumbs={[
          { href: "/careers", label: "Careers" },
          { href: `/careers/${o.category.slug}`, label: o.category.name },
          { href: `/careers/${o.category.slug}/${o.slug}`, label: o.title },
        ]}
      />
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <article className="space-y-10">
          <section aria-labelledby="about-role" className="prose-body text-lg">
            <h2 id="about-role" className="text-3xl">
              About the role
            </h2>
            {paragraphs(o.description).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
          <ListSection id="responsibilities" title="What you will do" items={o.responsibilities} />
          <ListSection id="qualifications" title="Qualifications" items={o.qualifications} />
          <ListSection id="requirements" title="Eligibility requirements" items={o.eligibilityRequirements} />
          <p className="text-stone-500">
            General requirements apply to all roles. <TextLink href="/eligibility">Read them before you apply</TextLink>.
          </p>
          <section aria-labelledby="how-to-apply" className="border-t border-stone-300 pt-8">
            <h2 id="how-to-apply" className="text-3xl">
              How to apply
            </h2>
            <p className="mt-4 max-w-[68ch]">{o.applicationInstructions}</p>
          </section>
        </article>

        <aside aria-label="Application dates" className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-stone-300 p-6">
            <AvailabilityTag availability={availability} />
            <dl className="mt-6 space-y-4">
              {o.applicationOpenAt ? (
                <div>
                  <dt className="text-sm text-stone-500">Applications open</dt>
                  <dd className="font-semibold">
                    <time dateTime={isoDate(o.applicationOpenAt)}>{formatDate(o.applicationOpenAt)}</time>
                  </dd>
                </div>
              ) : null}
              {o.applicationCloseAt ? (
                <div>
                  <dt className="text-sm text-stone-500">Applications close</dt>
                  <dd className="font-semibold">
                    <time dateTime={isoDate(o.applicationCloseAt)}>{formatDate(o.applicationCloseAt)}</time>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm text-stone-500">Field</dt>
                <dd className="font-semibold">{o.category.name}</dd>
              </div>
            </dl>
            {accepting ? (
              <ButtonLink href={`/apply?role=${encodeURIComponent(o.slug)}`} variant="primary" className="mt-6 w-full">
                Apply for this role
              </ButtonLink>
            ) : (
              <p className="mt-6 border-t border-stone-300 pt-4 text-sm text-stone-500">
                {availability === "NOT_YET_OPEN"
                  ? "Applications for this role have not opened yet."
                  : "Applications for this role are closed."}{" "}
                <TextLink href="/announcements">Check announcements</TextLink> for future intakes.
              </p>
            )}
          </div>
        </aside>
      </Container>
    </>
  );
}
