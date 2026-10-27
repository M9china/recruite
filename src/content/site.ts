/**
 * Organisation-level settings and copy that will not move to the database.
 *
 * DRAFT: every value here is a placeholder until the client approves it.
 * Set `contentApproved` to true only when all of src/content has been signed off;
 * until then a banner on every page says the content is a draft.
 */
export const site = {
  name: "Organisation Name",
  shortName: "Careers",
  contentApproved: false,

  hero: {
    headline: "A career in service starts here",
    lede: "Explore roles, check whether you qualify, and apply online in one place.",
  },

  intro: {
    heading: "Who we are",
    body: "Approved introduction to the organisation goes here: who it serves, what it does, and why people choose to join. Keep it to two or three sentences.",
  },

  about: {
    lede: "Mission, values and history, in the organisation's own words.",
    sections: [
      { heading: "Our mission", body: "Approved mission statement goes here." },
      { heading: "Our values", body: "Approved values go here, each with a one-line explanation." },
      { heading: "Our history", body: "A short, approved history of the organisation goes here." },
    ],
  },

  /** Verified figures only. Leave empty to hide the stats band. */
  stats: [] as { value: string; label: string; source: string }[],

  contact: {
    // null renders as "To be confirmed". Never publish an unverified number or address.
    phone: null as string | null,
    email: null as string | null,
    address: null as string | null,
    hours: null as string | null,
    /** Official social or messaging channels, verified by the client. */
    channels: [] as { label: string; href: string }[],
  },
} as const;

export const navigation = [
  { href: "/careers", label: "Careers" },
  { href: "/eligibility", label: "Eligibility" },
  { href: "/process", label: "How to apply" },
  { href: "/announcements", label: "Announcements" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const legalDocuments = [
  { slug: "privacy", title: "Privacy policy" },
  { slug: "data-processing", title: "Recruitment data-processing notice" },
  { slug: "terms", title: "Terms of use" },
  { slug: "cookies", title: "Cookie information" },
] as const;
