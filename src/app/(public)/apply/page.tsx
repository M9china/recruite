import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicationForm, type RoleOption } from "@/components/apply/ApplicationForm";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatDate } from "@/lib/format";
import { listApplyableOpportunities } from "@/server/services/content";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply online for an open role.",
};

// The list of open roles must always be current.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ role?: string | string[] }> };

export default async function ApplyPage({ searchParams }: Props) {
  const { role } = await searchParams;
  const opportunities = await listApplyableOpportunities();
  const roles: RoleOption[] = opportunities.map((o) => ({
    slug: o.slug,
    title: o.title,
    category: o.category.name,
    closes: o.applicationCloseAt ? formatDate(o.applicationCloseAt) : null,
  }));

  return (
    <>
      <PageHeader
        title="Apply online"
        lede="The application takes about 20 minutes. Your answers are kept on this device until you close the tab."
        crumbs={[{ href: "/apply", label: "Apply" }]}
      />
      <Container className="py-12 md:py-16">
        {roles.length > 0 ? (
          <ApplicationForm roles={roles} initialRole={typeof role === "string" ? role : undefined} />
        ) : (
          <div className="max-w-[60ch]">
            <h2 className="text-4xl">No roles are open right now</h2>
            <p className="mt-4 text-lg text-stone-500">
              Applications open at set times. Check the announcements for the next intake.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/announcements">See announcements</ButtonLink>
              <ButtonLink href="/careers" variant="outline">
                Explore careers
              </ButtonLink>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
