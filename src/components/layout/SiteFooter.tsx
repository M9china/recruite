import Link from "next/link";
import { legalDocuments, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "./Wordmark";

const columns = [
  {
    heading: "Careers",
    links: [
      { href: "/careers", label: "All careers" },
      { href: "/announcements", label: "Announcements" },
      { href: "/eligibility", label: "Eligibility" },
    ],
  },
  {
    heading: "Applying",
    links: [
      { href: "/process", label: "How to apply" },
      { href: "/apply", label: "Apply now" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Organisation",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

const TBC = "To be confirmed";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-charcoal-900 text-stone-100">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)] md:py-20">
        <div>
          <Wordmark className="text-white" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-stone-100/75">
            Applying is free. We never ask for payment and never use paid agents. Report anyone who asks you for money.
          </p>
          <dl className="mt-6 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-stone-100/60">Phone</dt>
              <dd>{site.contact.phone ?? TBC}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-stone-100/60">Email</dt>
              <dd>{site.contact.email ?? TBC}</dd>
            </div>
          </dl>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="font-sans text-sm font-semibold text-white">{col.heading}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-100/80 hover:text-white hover:underline hover:underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-4 py-6 text-sm text-stone-100/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalDocuments.map((d) => (
              <li key={d.slug}>
                <Link href={`/legal/${d.slug}`} className="hover:text-white hover:underline hover:underline-offset-4">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
