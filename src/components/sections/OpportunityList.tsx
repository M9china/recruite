import Link from "next/link";
import { AvailabilityTag } from "@/components/ui/AvailabilityTag";
import { formatDate, isoDate } from "@/lib/format";
import { getAvailability } from "@/lib/domain/opportunity";
import type { OpportunityWithCategory } from "@/server/services/content";

function dateLine(o: OpportunityWithCategory, now: Date) {
  const availability = getAvailability(o, now);
  if (availability === "NOT_YET_OPEN" && o.applicationOpenAt) {
    return { label: "Opens", date: o.applicationOpenAt };
  }
  if (o.applicationCloseAt) {
    return { label: availability === "CLOSED" ? "Closed" : "Closes", date: o.applicationCloseAt };
  }
  return null;
}

/** A ruled index of roles: easier to scan and compare than a wall of cards. */
export function OpportunityList({
  opportunities,
  showCategory = true,
  now = new Date(),
}: {
  opportunities: OpportunityWithCategory[];
  showCategory?: boolean;
  now?: Date;
}) {
  if (opportunities.length === 0) {
    return (
      <p className="border-y border-stone-300 py-8 text-stone-500">
        No roles are published in this field right now. Check the announcements page for upcoming intakes.
      </p>
    );
  }

  return (
    <ul className="border-t border-stone-300">
      {opportunities.map((o) => {
        const d = dateLine(o, now);
        return (
          <li key={o.id} className="border-b border-stone-300">
            <Link
              href={`/careers/${o.category.slug}/${o.slug}`}
              className="group grid gap-3 py-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10"
            >
              <div>
                {showCategory ? <p className="text-sm text-stone-500">{o.category.name}</p> : null}
                <h3 className="mt-1 text-2xl leading-tight group-hover:text-forest-600 md:text-3xl">{o.title}</h3>
                <p className="mt-2 max-w-[62ch] text-stone-500">{o.summary}</p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-2">
                <AvailabilityTag availability={getAvailability(o, now)} />
                {d ? (
                  <p className="text-sm text-stone-500">
                    {d.label} <time dateTime={isoDate(d.date)}>{formatDate(d.date)}</time>
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
