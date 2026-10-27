import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { legalContent } from "@/content/legal";

type Params = { params: Promise<{ doc: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalContent).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = legalContent[(await params).doc];
  return doc ? { title: doc.title, description: doc.lede } : {};
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default async function LegalPage({ params }: Params) {
  const key = (await params).doc;
  const doc = legalContent[key];
  if (!doc) notFound();

  return (
    <>
      <PageHeader title={doc.title} lede={doc.lede} crumbs={[{ href: `/legal/${key}`, label: doc.title }]} />
      <Container className="grid gap-12 py-16 md:py-20 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
          <ol className="space-y-2 text-sm">
            {doc.sections.map((s) => (
              <li key={s}>
                <a href={`#${slug(s)}`} className="text-stone-500 hover:text-forest-600 hover:underline hover:underline-offset-4">
                  {s}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          <p role="note" className="mb-12 max-w-[68ch] border-l-4 border-sand-400 bg-stone-100 px-5 py-4">
            Draft structure. The text of this page must be provided and approved by the organisation before launch.
          </p>
          <div className="space-y-10">
            {doc.sections.map((s) => (
              <section key={s} aria-labelledby={slug(s)}>
                <h2 id={slug(s)} className="text-3xl">
                  {s}
                </h2>
                <p className="mt-3 max-w-[68ch] text-stone-500">Approved text to be supplied.</p>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
