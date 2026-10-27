import type { Benefit, ProcessStep } from "./types";

/**
 * Static page copy that is not managed in the database. DRAFT: benefits and
 * process steps must be confirmed by the client before launch.
 * Database-managed draft content lives in prisma/seed-data.
 */

export const benefits: Benefit[] = [
  { title: "Paid training", body: "Training for your role, with pay, from your first day." },
  { title: "Skills that count", body: "Learn skills and qualifications you can build a career on." },
  { title: "Room to grow", body: "Clear paths to promotion and specialist roles as you gain experience." },
  { title: "Health and support", body: "Access to health care and support services while you serve." },
  { title: "Work that matters", body: "Serve your country and the communities you live in." },
  { title: "A team behind you", body: "Train and work alongside people who depend on each other." },
];

/** The real process must be confirmed by the client; steps 5 and 6 especially. */
export const processSteps: ProcessStep[] = [
  {
    title: "Check you are eligible",
    body: "Read the eligibility requirements and make sure you meet them before you apply.",
  },
  {
    title: "Choose a role",
    body: "Browse open roles by field. Each role shows what you will do, what you need and when applications close.",
  },
  {
    title: "Apply online",
    body: "Complete the application form. You can review everything before you submit.",
  },
  {
    title: "Get your reference number",
    body: "When your application is submitted, you will see a reference number on screen and receive it by email. Keep it for any questions.",
  },
  {
    title: "Assessment, if selected",
    body: "Shortlisted applicants are contacted through official channels with details of the next steps.",
  },
  {
    title: "Hear the outcome",
    body: "You will be told the outcome of your application by email.",
  },
];
