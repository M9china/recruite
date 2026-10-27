import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { processSteps } from "@/content/recruitment";

export const metadata: Metadata = {
  title: "How to apply",
  description: "The recruitment process step by step, from checking eligibility to hearing the outcome.",
};

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        title="How to apply"
        lede="What happens from the moment you check whether you qualify to the moment you hear back."
        crumbs={[{ href: "/process", label: "How to apply" }]}
      />
      <Container className="py-16 md:py-24">
        <ProcessSteps steps={processSteps} variant="full" />
        <div className="mt-16 flex flex-col gap-3 border-t-2 border-forest-800 pt-8 sm:flex-row">
          <ButtonLink href="/eligibility" variant="outline">
            Check eligibility
          </ButtonLink>
          <ButtonLink href="/careers">Explore careers</ButtonLink>
        </div>
      </Container>
    </>
  );
}
