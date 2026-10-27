import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function ContactBand() {
  return (
    <section aria-labelledby="contact-band-title" className="bg-olive-900 text-white">
      <Container className="flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-20">
        <div className="max-w-xl">
          <h2 id="contact-band-title" className="text-4xl leading-none md:text-5xl">
            Questions before you apply?
          </h2>
          <p className="mt-4 text-lg text-stone-100/85">
            Check the FAQ first. If your question is not answered there, contact the recruitment office directly.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" variant="accent">
            Contact us
          </ButtonLink>
          <ButtonLink href="/faq" variant="outline-light">
            Read the FAQ
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
