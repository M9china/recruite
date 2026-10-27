import { site } from "@/content/site";

/** Shown on every page until the client approves the content in src/content. */
export function DraftBanner() {
  if (site.contentApproved) return null;
  return (
    <div className="bg-sand-400 px-4 py-2 text-center text-sm text-charcoal-900">
      Draft site: names, requirements, dates and contact details are placeholders awaiting approval.
    </div>
  );
}
