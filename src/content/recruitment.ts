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
    title: "ChECK YOU ARE ELIGIBLE",
    body: "Fill out the form on the website. We will contact you within 24 hours.",
  },
  {
    title: "MEETING WITH THE MANAGER",
    body: "Initial selection: checking compliance with basic requirements (age, health, documents).",
  },
  {
    title: "INTERVIEW & CALL",
    body: "Detailed interview to assess motivation and choose the right military specialty.",
  },
  {
    title: "DOCUMENTS SUBMISSION",
    body: "Filling out an application form and submitting a package of documents to the authorized bodies for verification",
  },
  {
    title: "MEDICAL TESTS",
    body: "Optional — undergoing a medical examination to confirm fitness for service.",
  },
  {
    title: "FINAL MEDICAL AND CONTRACT SIGNING",
    body: "Final medical commission, signing the contract, departure to the training camp for basic training",
  },
];
