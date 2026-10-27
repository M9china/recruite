import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { listEligibilityGroups } from "@/server/services/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Eligibility",
  description: "The general requirements every applicant must meet, and where to find role-specific requirements.",
};

export default async function EligibilityPage() {
  const groups = await listEligibilityGroups();

  return (
    <>
      <PageHeader
        title="Eligibility"
        lede="Check that you meet these requirements before you apply. Some roles have extra requirements, listed on the role's page."
        crumbs={[{ href: "/eligibility", label: "Eligibility" }]}
      />
      <Container className="py-16 md:py-20">
        <div className="space-y-16">
          {groups.map((g) => (
            <section key={g.group} aria-labelledby={`group-${g.group}`} className="grid gap-6 md:grid-cols-[16rem_1fr] md:gap-12">
              <h2 id={`group-${g.group}`} className="text-4xl leading-none">
                {g.group}
              </h2>
              <dl className="border-t border-stone-300">
                {g.items.map((item) => (
                  <div key={item.id} className="grid gap-2 border-b border-stone-300 py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
                    <dt className="text-lg font-semibold">{item.title}</dt>
                    <dd className="max-w-[60ch] text-stone-500">{item.body}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t-2 border-forest-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg">Meet the requirements? Find a role that suits you.</p>
          <ButtonLink href="/careers">Explore careers</ButtonLink>
        </div>
      </Container>
    </>
  );
}
