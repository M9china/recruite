import Link from "next/link";

type Variant = "primary" | "accent" | "outline" | "outline-light";

const styles: Record<Variant, string> = {
  primary: "bg-forest-800 text-white hover:bg-forest-600",
  accent: "bg-sand-400 text-charcoal-900 hover:bg-sand-200",
  outline: "border border-forest-800 text-forest-800 hover:bg-forest-800 hover:text-white",
  "outline-light": "border border-white/70 text-white hover:bg-white hover:text-charcoal-900",
};

const base =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] px-6 font-semibold transition-colors duration-150";

export function buttonClasses(variant: Variant = "primary", className = "") {
  return `${base} ${styles[variant]} ${className}`;
}

type LinkProps = { href: string; variant?: Variant; className?: string; children: React.ReactNode };

export function ButtonLink({ href, variant = "primary", className, children }: LinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}
