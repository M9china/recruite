import Link from "next/link";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import type { CategoryWithCounts } from "@/server/services/content";

function openLabel(n: number) {
  if (n === 0) return "No roles open right now";
  return n === 1 ? "1 role open" : `${n} roles open`;
}

/** Career fields as photo cards. The whole card is one link. */
export function CategoryGrid({ categories }: { categories: CategoryWithCounts[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/careers/${c.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
              <PhotoSlot
                image={c.image}
                brief={c.name.toLowerCase()}
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                className="transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <h3 className="mt-5 text-3xl leading-none group-hover:text-forest-600">{c.name}</h3>
            <p className="mt-3 text-stone-500">{c.description}</p>
            <p className="mt-4 text-sm font-semibold text-forest-600">{openLabel(c.openCount)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
