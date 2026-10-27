import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply online for an open role.",
};

/**
 * Holding page. The multi-step application form, server validation and
 * persistence arrive in Milestone 4; nothing here accepts personal data.
 */
export default function ApplyPage() {
  return (
    <>
      <PageHeader
        title="Apply online"
        lede="Online applications are not open on this site yet."
        crumbs={[{ href: "/apply", label: "Apply" }]}
      />
      <Container className="py-16 md:py-20">
        <div className="max-w-[60ch] space-y-4 text-lg">
          <p>
            When applications open, you will complete the form here in six steps and receive a reference number by email.
          </p>
          <p className="text-stone-500">In the meantime, check that you are eligible and find the role you want.</p>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/eligibility" variant="outline">
            Check eligibility
          </ButtonLink>
          <ButtonLink href="/careers">Explore careers</ButtonLink>
        </div>
      </Container>
    </>
  );
}
