import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { isAnnouncementActive } from "@/lib/domain/opportunity";
import { formatDate, isoDate, paragraphs } from "@/lib/format";
import { getAnnouncement, listAnnouncements } from "@/server/services/content";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listAnnouncements()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const a = await getAnnouncement((await params).slug);
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function AnnouncementPage({ params }: Params) {
  const now = new Date();
  const a = await getAnnouncement((await params).slug, now);
  if (!a) notFound();
  const active = isAnnouncementActive(a.closingAt, now);

  return (
    <>
      <PageHeader
        title={a.title}
        lede={a.summary}
        crumbs={[
          { href: "/announcements", label: "Announcements" },
          { href: `/announcements/${a.slug}`, label: a.title },
        ]}
      >
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          {a.publishedAt ? (
            <div>
              <dt className="text-stone-100/70">Published</dt>
              <dd className="font-semibold">
                <time dateTime={isoDate(a.publishedAt)}>{formatDate(a.publishedAt)}</time>
              </dd>
            </div>
          ) : null}
          {a.closingAt ? (
            <div>
              <dt className="text-stone-100/70">{active ? "Closes" : "Closed"}</dt>
              <dd className="font-semibold">
                <time dateTime={isoDate(a.closingAt)}>{formatDate(a.closingAt)}</time>
              </dd>
            </div>
          ) : null}
        </dl>
      </PageHeader>
      <Container className="py-16 md:py-20">
        {!active ? (
          <p role="note" className="mb-10 max-w-[68ch] border-l-4 border-stone-500 bg-stone-100 px-5 py-4">
            This notice has closed and is kept for reference only.
          </p>
        ) : null}
        <div className="prose-body text-lg">
          {paragraphs(a.content).map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-12">
          <TextLink href={active ? "/careers" : "/announcements"}>
            {active ? "See open roles" : "Back to announcements"}
          </TextLink>
        </p>
      </Container>
    </>
  );
}
