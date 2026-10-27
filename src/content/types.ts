/**
 * Content shapes. Database-backed types mirror the Prisma models so that
 * Milestone 3 can swap the source without touching pages.
 */
export type ImageRef = { src: string; alt: string };

export type CareerCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  published: boolean;
  /** Not in the database yet; licensed photography is supplied by the client. */
  image?: ImageRef;
};

export type CareerOpportunity = {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  eligibilityRequirements: string[];
  applicationInstructions: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  applicationOpenAt: Date | null;
  applicationCloseAt: Date | null;
};

export type Announcement = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  /** Plain text; blank lines separate paragraphs. */
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
  closingAt: Date | null;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  published: boolean;
};

export type EligibilityCriterion = {
  id: string;
  group: string;
  title: string;
  body: string;
  displayOrder: number;
  published: boolean;
};

export type Benefit = { title: string; body: string };
export type ProcessStep = { title: string; body: string };
