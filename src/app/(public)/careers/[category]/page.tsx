import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { OpportunityList } from "@/components/sections/OpportunityList";
import { getCategory, listCategories, listOpportunities } from "@/server/services/content";

export const revalidate = 3600;

type Params = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = await getCategory((await params).category);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params }: Params) {
  const category = await getCategory((await params).category);
  if (!category) notFound();

  const now = new Date();
  const opportunities = await listOpportunities({ categoryId: category.id, now });

  return (
    <>
      <PageHeader
        title={category.name}
        lede={category.description}
        crumbs={[
          { href: "/careers", label: "Careers" },
          { href: `/careers/${category.slug}`, label: category.name },
        ]}
      />
      <Container className="py-16 md:py-20">
        <OpportunityList opportunities={opportunities} showCategory={false} now={now} />
        <p className="mt-10">
          <TextLink href="/careers">See roles in every field</TextLink>
        </p>
      </Container>
    </>
  );
}
