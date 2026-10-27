import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: site.about.lede,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title={`About ${site.name}`} lede={site.about.lede} crumbs={[{ href: "/about", label: "About" }]} />
      <div className="relative h-[clamp(240px,40vw,480px)]">
        <PhotoSlot brief="personnel at work, unposed" />
      </div>
      <Container className="py-16 md:py-24">
        <div className="space-y-14">
          {site.about.sections.map((s) => (
            <section key={s.heading} className="grid gap-4 border-t border-stone-300 pt-8 md:grid-cols-[16rem_1fr] md:gap-12">
              <h2 className="text-4xl leading-none">{s.heading}</h2>
              <p className="max-w-[64ch] text-lg">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-16">
          <ButtonLink href="/careers">Explore careers</ButtonLink>
        </div>
      </Container>
    </>
  );
}
