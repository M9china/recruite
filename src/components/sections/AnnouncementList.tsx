import Link from "next/link";
import type { Announcement } from "@/content/types";
import { isAnnouncementActive } from "@/lib/domain/opportunity";
import { formatDate, isoDate } from "@/lib/format";

/** Expired notices are labelled "Closed" and never styled as active. */
export function AnnouncementList({ announcements, now = new Date() }: { announcements: Announcement[]; now?: Date }) {
  if (announcements.length === 0) {
    return <p className="border-y border-stone-300 py-8 text-stone-500">There are no announcements right now.</p>;
  }
  return (
    <ul className="border-t border-stone-300">
      {announcements.map((a) => {
        const active = isAnnouncementActive(a.closingAt, now);
        return (
          <li key={a.id} className="border-b border-stone-300">
            <Link
              href={`/announcements/${a.slug}`}
              className="group grid gap-2 py-6 md:grid-cols-[11rem_1fr] md:gap-10"
            >
              <p className="text-sm text-stone-500">
                {a.publishedAt ? <time dateTime={isoDate(a.publishedAt)}>{formatDate(a.publishedAt)}</time> : null}
              </p>
              <div>
                <h3 className={`text-2xl leading-tight group-hover:text-forest-600 ${active ? "" : "text-stone-500"}`}>
                  {a.title}
                </h3>
                <p className="mt-2 max-w-[62ch] text-stone-500">{a.summary}</p>
                {a.closingAt ? (
                  <p className={`mt-3 text-sm font-semibold ${active ? "text-forest-600" : "text-stone-500"}`}>
                    {active ? "Open until " : "Closed on "}
                    <time dateTime={isoDate(a.closingAt)}>{formatDate(a.closingAt)}</time>
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
