import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { isValidReference } from "@/lib/domain/reference";

export const metadata: Metadata = {
  title: "Application submitted",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ ref?: string | string[] }> };

/**
 * Shows the reference returned by the submission. Nothing is looked up: the
 * page only displays a well-formed reference passed to it, so it reveals no data.
 */
export default async function ConfirmationPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && isValidReference(ref) ? ref : null;

  return (
    <Container className="py-16 md:py-24">
      <div className="max-w-2xl">
        <div className="bg-forest-800 px-6 py-10 text-white md:px-10">
          <h1 className="text-5xl leading-none md:text-6xl">Application submitted</h1>
          {reference ? (
            <>
              <p className="mt-6 text-lg text-stone-100">Your reference number is</p>
              <p className="mt-1 font-display text-4xl font-bold tracking-wide text-sand-400 md:text-5xl">{reference}</p>
            </>
          ) : null}
        </div>
        <div className="mt-10 space-y-4 text-lg">
          <p>Write down your reference number or take a screenshot. Quote it if you contact us about your application.</p>
          <h2 className="pt-4 text-3xl">What happens next</h2>
          <p>
            We will review your application. If you are selected for the next stage, we will contact you using the email address
            or phone number you gave us.
          </p>
          <p className="text-stone-500">
            We only contact applicants through the official channels on our <TextLink href="/contact">contact page</TextLink>. We
            never ask for payment.
          </p>
        </div>
        <div className="mt-10">
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
