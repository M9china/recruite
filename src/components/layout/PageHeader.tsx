import Link from "next/link";
import { Container } from "@/components/ui/Container";

type Crumb = { href: string; label: string };

type Props = {
  title: string;
  lede?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
};

/** Interior page header: breadcrumbs, title and lede on the olive band. */
export function PageHeader({ title, lede, crumbs = [], children }: Props) {
  return (
    <div className="bg-olive-900 text-white">
      <Container className="pb-14 pt-10 md:pb-20 md:pt-14">
        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-8 text-sm">
            <ol className="flex flex-wrap items-center gap-2 text-stone-100/75">
              <li>
                <Link href="/" className="hover:text-white hover:underline hover:underline-offset-4">
                  Home
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  <Link href={c.href} className="hover:text-white hover:underline hover:underline-offset-4">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="max-w-4xl text-5xl leading-[0.95] md:text-7xl">{title}</h1>
        {lede ? <p className="mt-6 max-w-2xl text-lg text-stone-100/85 md:text-xl">{lede}</p> : null}
        {children}
      </Container>
    </div>
  );
}
