import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Benefit } from "@/content/types";

export function BenefitsBand({ benefits }: { benefits: Benefit[] }) {
  return (
    <section aria-labelledby="benefits-title" className="bg-forest-800 py-20 text-white md:py-28">
      <Container>
        <SectionHeading
          id="benefits-title"
          tone="light"
          title="What you gain"
          lede="Training, qualifications and a career path, alongside the chance to serve."
        />
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title} className="border-t-2 border-sand-400 pt-5">
              <h3 className="text-2xl">{b.title}</h3>
              <p className="mt-2 text-stone-100/80">{b.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
