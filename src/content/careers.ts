import type { CareerCategory, CareerOpportunity } from "./types";

/**
 * DRAFT sample content, replaced by client-confirmed records in the database
 * from Milestone 3. Requirements are deliberately left unstated: the site must
 * never publish recruitment policy the organisation has not approved.
 */
const TO_CONFIRM = "To be confirmed by the organisation for this intake.";

export const categories: CareerCategory[] = [
  {
    id: "cat-field",
    name: "Field operations",
    slug: "field-operations",
    description: "Front-line roles that train for deployment, patrol and protection duties.",
    displayOrder: 1,
    published: true,
  },
  {
    id: "cat-engineering",
    name: "Engineering and technical",
    slug: "engineering-technical",
    description: "Build, maintain and repair the equipment, vehicles and infrastructure others rely on.",
    displayOrder: 2,
    published: true,
  },
  {
    id: "cat-logistics",
    name: "Logistics and supply",
    slug: "logistics-supply",
    description: "Move people, equipment and supplies to where they are needed, on time.",
    displayOrder: 3,
    published: true,
  },
  {
    id: "cat-health",
    name: "Health services",
    slug: "health-services",
    description: "Care for personnel in clinics and in the field, from first response to recovery.",
    displayOrder: 4,
    published: true,
  },
  {
    id: "cat-comms",
    name: "Communications and IT",
    slug: "communications-it",
    description: "Keep units connected and information secure, from radio networks to data systems.",
    displayOrder: 5,
    published: true,
  },
];

const howToApply =
  "Read the eligibility requirements, then complete the online application while this role is open. You will receive a reference number by email when your application is submitted.";

export const opportunities: CareerOpportunity[] = [
  {
    id: "opp-field-1",
    categoryId: "cat-field",
    title: "Field operations recruit",
    slug: "field-operations-recruit",
    summary: "Entry-level role for applicants starting their service career in field operations.",
    description:
      "Recruits complete basic training before joining a unit. Day-to-day work combines physical training, skills practice and operational duties as part of a team.",
    responsibilities: [
      "Complete basic and role-specific training",
      "Carry out duties as part of a team under supervision",
      "Maintain personal equipment and fitness standards",
    ],
    qualifications: [TO_CONFIRM],
    eligibilityRequirements: [TO_CONFIRM],
    applicationInstructions: howToApply,
    status: "OPEN",
    applicationOpenAt: new Date("2026-10-01T00:00:00+02:00"),
    applicationCloseAt: new Date("2026-12-15T23:59:00+02:00"),
  },
  {
    id: "opp-eng-1",
    categoryId: "cat-engineering",
    title: "Vehicle technician trainee",
    slug: "vehicle-technician-trainee",
    summary: "Train to inspect, service and repair a range of vehicles and mechanical systems.",
    description:
      "Trainees learn workshop practice and diagnostics alongside qualified technicians, then take on maintenance work in their unit.",
    responsibilities: [
      "Carry out scheduled inspections and servicing",
      "Diagnose and repair mechanical faults",
      "Keep accurate maintenance records",
    ],
    qualifications: [TO_CONFIRM],
    eligibilityRequirements: [TO_CONFIRM],
    applicationInstructions: howToApply,
    status: "OPEN",
    applicationOpenAt: new Date("2026-10-01T00:00:00+02:00"),
    applicationCloseAt: new Date("2026-11-01T23:59:00+02:00"),
  },
  {
    id: "opp-log-1",
    categoryId: "cat-logistics",
    title: "Supply chain clerk",
    slug: "supply-chain-clerk",
    summary: "Track, store and issue equipment and supplies accurately.",
    description:
      "Supply chain clerks manage stock from delivery to issue, using inventory systems and working closely with transport teams.",
    responsibilities: [
      "Receive, record and store incoming stock",
      "Issue equipment and supplies against requests",
      "Run stock counts and resolve discrepancies",
    ],
    qualifications: [TO_CONFIRM],
    eligibilityRequirements: [TO_CONFIRM],
    applicationInstructions: howToApply,
    status: "OPEN",
    applicationOpenAt: new Date("2026-10-01T00:00:00+02:00"),
    applicationCloseAt: new Date("2026-11-30T23:59:00+02:00"),
  },
  {
    id: "opp-health-1",
    categoryId: "cat-health",
    title: "Health care assistant",
    slug: "health-care-assistant",
    summary: "Support clinical staff with patient care in clinics and in the field.",
    description:
      "Health care assistants help nursing and medical staff with routine care, first response and keeping clinical areas ready for use.",
    responsibilities: [
      "Assist with routine patient care and observations",
      "Prepare and restock clinical areas and kits",
      "Support first response under clinical supervision",
    ],
    qualifications: [TO_CONFIRM],
    eligibilityRequirements: [TO_CONFIRM],
    applicationInstructions: howToApply,
    status: "OPEN",
    applicationOpenAt: new Date("2027-01-15T00:00:00+02:00"),
    applicationCloseAt: new Date("2027-03-15T23:59:00+02:00"),
  },
  {
    id: "opp-comms-1",
    categoryId: "cat-comms",
    title: "Network support technician",
    slug: "network-support-technician",
    summary: "Install and support the communications equipment and networks units depend on.",
    description:
      "Technicians set up, test and troubleshoot radio and data equipment, and help users keep systems secure.",
    responsibilities: [
      "Install and configure communications equipment",
      "Diagnose and fix network and radio faults",
      "Follow information security procedures",
    ],
    qualifications: [TO_CONFIRM],
    eligibilityRequirements: [TO_CONFIRM],
    applicationInstructions: howToApply,
    status: "CLOSED",
    applicationOpenAt: new Date("2026-07-01T00:00:00+02:00"),
    applicationCloseAt: new Date("2026-09-30T23:59:00+02:00"),
  },
];
