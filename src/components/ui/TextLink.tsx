import Link from "next/link";

type Props = { href: string; children: React.ReactNode; tone?: "dark" | "light"; className?: string };

/** Underlined inline link; the underline thickens on hover rather than appearing. */
export function TextLink({ href, children, tone = "dark", className = "" }: Props) {
  const color = tone === "dark" ? "text-forest-600 decoration-forest-600/40" : "text-sand-400 decoration-sand-400/50";
  return (
    <Link
      href={href}
      className={`font-semibold underline underline-offset-4 transition-[text-decoration-thickness] hover:decoration-2 ${color} ${className}`}
    >
      {children}
    </Link>
  );
}
