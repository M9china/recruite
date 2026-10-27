import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Official contact details for the recruitment office.",
};

const TBC = "To be confirmed";

const fieldClass =
  "mt-2 block w-full rounded-[var(--radius-control)] border border-stone-500 bg-white px-4 py-3 text-base disabled:cursor-not-allowed disabled:bg-stone-100";

/**
 * The enquiry form is wired to the backend in a later milestone. Until then it
 * is rendered disabled rather than pretending to send.
 */
export default function ContactPage() {
  const { phone, email, address, hours, channels } = site.contact;
  return (
    <>
      <PageHeader
        title="Contact"
        lede="Questions about roles, eligibility or your application. Check the FAQ first; many answers are there."
        crumbs={[{ href: "/contact", label: "Contact" }]}
      />
      <Container className="grid gap-16 py-16 md:py-20 lg:grid-cols-[1fr_1.3fr]">
        <section aria-labelledby="official-channels">
          <h2 id="official-channels" className="text-4xl">
            Official channels
          </h2>
          <p className="mt-3 max-w-[48ch] text-stone-500">
            These are the only channels we use. We will never ask you for money or banking details.
          </p>
          <dl className="mt-8 border-t border-stone-300">
            {[
              ["Phone", phone],
              ["Email", email],
              ["Office address", address],
              ["Office hours", hours],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-stone-300 py-4">
                <dt className="text-stone-500">{label}</dt>
                <dd className="font-semibold">{value ?? TBC}</dd>
              </div>
            ))}
          </dl>
          {channels.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {channels.map((c) => (
                <li key={c.href}>
                  <a href={c.href} rel="noopener noreferrer" className="font-semibold text-forest-600 underline underline-offset-4">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-8 text-stone-500">
            Someone asked you to pay to apply? Do not pay. <TextLink href="/faq#faq-fee">Read why</TextLink>.
          </p>
        </section>

        <section aria-labelledby="enquiry-form" className="rounded-[var(--radius-card)] bg-stone-100 p-6 md:p-10">
          <h2 id="enquiry-form" className="text-4xl">
            Send an enquiry
          </h2>
          <p role="status" className="mt-3 border-l-4 border-sand-400 bg-white px-4 py-3 text-sm">
            Online enquiries are not available yet. Use the phone or email details for now.
          </p>
          <form className="mt-8" aria-labelledby="enquiry-form" noValidate>
            <fieldset disabled className="space-y-6">
              <legend className="sr-only">Your enquiry</legend>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block font-semibold">
                  Full name
                  <input name="name" autoComplete="name" className={fieldClass} />
                </label>
                <label className="block font-semibold">
                  Email address
                  <input name="email" type="email" autoComplete="email" className={fieldClass} />
                </label>
              </div>
              <label className="block font-semibold">
                Subject
                <input name="subject" className={fieldClass} />
              </label>
              <label className="block font-semibold">
                Message
                <textarea name="message" rows={6} className={fieldClass} />
              </label>
              <p className="text-sm text-stone-500">
                Do not include ID numbers or medical details. See the{" "}
                <TextLink href="/legal/privacy">privacy policy</TextLink> for how we use your information.
              </p>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-forest-800 px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send enquiry
              </button>
            </fieldset>
          </form>
        </section>
      </Container>
    </>
  );
}
