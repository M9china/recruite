import type { Announcement, EligibilityCriterion, Faq } from "@/content/types";

/**
 * DRAFT sample records loaded by `npm run db:seed` (development only).
 * Eligibility wording and FAQ answers must be confirmed by the client.
 */

const PENDING = "This requirement will be published here once the organisation confirms it for the current intake.";

export const eligibility: EligibilityCriterion[] = [
  { id: "el-age", group: "Personal", title: "Age", body: PENDING, displayOrder: 1, published: true },
  { id: "el-cit", group: "Personal", title: "Citizenship", body: PENDING, displayOrder: 2, published: true },
  { id: "el-edu", group: "Education", title: "Minimum education", body: PENDING, displayOrder: 3, published: true },
  { id: "el-role", group: "Education", title: "Role-specific qualifications", body: "Some roles need extra qualifications. These are listed on each role's page.", displayOrder: 4, published: true },
  { id: "el-fit", group: "Health and fitness", title: "Physical fitness", body: PENDING, displayOrder: 5, published: true },
  { id: "el-med", group: "Health and fitness", title: "Medical standards", body: PENDING, displayOrder: 6, published: true },
  { id: "el-docs", group: "Documents and checks", title: "Documents", body: PENDING, displayOrder: 7, published: true },
  { id: "el-bg", group: "Documents and checks", title: "Background checks", body: PENDING, displayOrder: 8, published: true },
];

export const faqs: Faq[] = [
  {
    id: "faq-fee",
    category: "Applying",
    question: "Do I have to pay to apply?",
    answer:
      "No. Applying is free. We never ask applicants to pay a fee, and we never use agents or recruiters who charge you. If anyone asks you for money to apply, do not pay and report it to us through the Contact page.",
    displayOrder: 1,
    published: true,
  },
  {
    id: "faq-how",
    category: "Applying",
    question: "How do I apply?",
    answer:
      "Choose an open role on the Careers page and complete the online application. You will receive a reference number when it is submitted.",
    displayOrder: 2,
    published: true,
  },
  {
    id: "faq-multiple",
    category: "Applying",
    question: "Can I apply for more than one role?",
    answer: "To be confirmed by the organisation.",
    displayOrder: 3,
    published: true,
  },
  {
    id: "faq-eligible",
    category: "Eligibility",
    question: "How do I know if I qualify?",
    answer:
      "Read the Eligibility page for the general requirements, then check the requirements listed on the role you are interested in.",
    displayOrder: 1,
    published: true,
  },
  {
    id: "faq-contact",
    category: "After you apply",
    question: "How will you contact me?",
    answer:
      "Only through the official email address and phone numbers listed on the Contact page. We will never ask for payment or for your banking details.",
    displayOrder: 1,
    published: true,
  },
  {
    id: "faq-time",
    category: "After you apply",
    question: "How long until I hear back?",
    answer: "To be confirmed by the organisation.",
    displayOrder: 2,
    published: true,
  },
];

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Sample notice: recruitment intake now open",
    slug: "sample-intake-open",
    summary: "Applications are open for selected roles until 15 December 2026.",
    content:
      "This is sample text for a recruitment notice. A real notice states which roles are open, the opening and closing dates, who may apply and how to apply.\n\nApplications are made online only, through this website. Applying is free.",
    status: "PUBLISHED",
    publishedAt: new Date("2026-10-01T08:00:00+02:00"),
    closingAt: new Date("2026-12-15T23:59:00+02:00"),
  },
  {
    id: "ann-2",
    title: "Sample notice: earlier intake closed",
    slug: "sample-intake-closed",
    summary: "The earlier intake for communications roles has closed.",
    content:
      "This is sample text for a closed notice. Closed notices stay visible for reference but are never shown as open opportunities.",
    status: "PUBLISHED",
    publishedAt: new Date("2026-07-01T08:00:00+02:00"),
    closingAt: new Date("2026-09-30T23:59:00+02:00"),
  },
];
