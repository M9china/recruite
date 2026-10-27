import Link from "next/link";
import { site } from "@/content/site";

/** Text wordmark until the client supplies an approved logo. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={`${site.name} ${site.shortName}, home`}>
      <span aria-hidden="true" className="block h-8 w-1.5 bg-sand-400 transition-[height] duration-150 group-hover:h-9" />
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap font-display text-xl font-bold">{site.name}</span>
        <span className="mt-1 text-xs text-current opacity-75">{site.shortName}</span>
      </span>
    </Link>
  );
}
