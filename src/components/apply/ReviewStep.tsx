"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/form/fields";
import { DOCUMENT_RULES, formatBytes } from "@/lib/domain/documents";
import { formatIsoDate, formatIsoMonth } from "@/lib/format";
import {
  HAS_SPOUSE,
  MARITAL_STATUS_LABELS,
  type MaritalStatus,
  WORK_STATUS_LABELS,
  type WorkStatus,
} from "@/lib/validation/questionnaire";
import type { Draft, ParentDraft, UploadedDocument } from "./model";

type Props = {
  draft: Draft;
  roleTitle: string;
  uploads: UploadedDocument[];
  errors: Record<string, string>;
  onEdit: (stepIndex: number) => void;
  onDeclaration: (key: keyof Draft["declarations"], value: boolean) => void;
};

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (i: number) => void; children: ReactNode }) {
  return (
    <section className="border-t border-stone-300 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-2xl">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="font-semibold text-forest-600 underline underline-offset-4">
          Change<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-[14rem_1fr]">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold break-words">{value || "Not given"}</dd>
    </>
  );
}

const parentSummary = (p: ParentDraft) =>
  p.has === "YES"
    ? [p.details.firstNames, p.details.middleName, p.details.surname].filter(Boolean).join(" ") +
      `, born ${formatIsoDate(p.details.dateOfBirth)} in ${p.details.placeOfBirth}`
    : "No";

export function ReviewStep({ draft, roleTitle, uploads, errors, onEdit, onDeclaration }: Props) {
  const q = draft.questionnaire;
  const a = q.residence.address;
  const photo = uploads.find((u) => u.documentType === "PHOTO");
  const others = uploads.filter((u) => u.documentType !== "PHOTO");
  return (
    <div>
      <Section title="Role" step={0} onEdit={onEdit}>
        <Row label="Applying for" value={roleTitle} />
      </Section>

      <Section title="About you" step={1} onEdit={onEdit}>
        <Row label="Surname" value={q.personal.surname} />
        <Row label="First name" value={q.personal.firstName} />
        {q.personal.middleName ? <Row label="Middle name" value={q.personal.middleName} /> : null}
        <Row label="Marital status" value={MARITAL_STATUS_LABELS[q.personal.maritalStatus as MaritalStatus]} />
        {HAS_SPOUSE.has(q.personal.maritalStatus as MaritalStatus) ? (
          <>
            <Row label="Spouse or partner's place of birth" value={`${q.personal.spouse.birthCity}, ${q.personal.spouse.birthCountry}`} />
            <Row label="Spouse or partner's citizenship" value={q.personal.spouse.citizenship} />
          </>
        ) : null}
      </Section>

      <Section title="Your parents" step={2} onEdit={onEdit}>
        <Row label="Father" value={parentSummary(q.parents.father)} />
        <Row label="Mother" value={parentSummary(q.parents.mother)} />
      </Section>

      <Section title="Address and contact details" step={3} onEdit={onEdit}>
        <Row
          label="Place of residence"
          value={
            q.residence.status === "YES"
              ? [a.apartment && `Apartment ${a.apartment}`, `${a.building} ${a.street}`, a.city, a.postalCode, a.country]
                  .filter(Boolean)
                  .join(", ")
              : "No permanent place of residence"
          }
        />
        <Row label="Phone numbers" value={q.contact.phones.filter(Boolean).join(", ")} />
        <Row label="Email addresses" value={q.contact.emails.filter(Boolean).join(", ")} />
      </Section>

      <Section title="Work and education" step={4} onEdit={onEdit}>
        <Row label="Working or worked before" value={WORK_STATUS_LABELS[q.work.status as WorkStatus]} />
        {q.work.status === "YES"
          ? q.work.history.map((h, i) => (
              <Row
                key={i}
                label={`Place ${i + 1}`}
                value={`${h.organisation}, ${h.role}. ${h.address}. ${formatIsoMonth(h.from)} to ${h.to ? formatIsoMonth(h.to) : "present"}`}
              />
            ))
          : null}
      </Section>

      <Section title="Photo and documents" step={5} onEdit={onEdit}>
        <Row label="Photo" value={photo ? photo.filename : undefined} />
        <Row
          label="Supporting documents"
          value={
            others.length
              ? others.map((d) => `${d.filename} (${DOCUMENT_RULES[d.documentType].label}, ${formatBytes(d.size)})`).join("; ")
              : "None"
          }
        />
      </Section>

      <section aria-labelledby="declaration-heading" className="mt-6 border-t-2 border-forest-800 pt-8">
        <h3 id="declaration-heading" className="text-3xl">
          Declaration
        </h3>
        <div className="mt-5 space-y-4">
          <Checkbox
            path="declarations.truthful"
            checked={draft.declarations.truthful}
            onChange={(v) => onDeclaration("truthful", v)}
            error={errors["declarations.truthful"]}
            label="I confirm that I have answered all questions truthfully and completely."
          />
          <Checkbox
            path="declarations.matchesDocuments"
            checked={draft.declarations.matchesDocuments}
            onChange={(v) => onDeclaration("matchesDocuments", v)}
            error={errors["declarations.matchesDocuments"]}
            label="I confirm that the information I have given matches my documents."
          />
          <Checkbox
            path="declarations.privacyNotice"
            checked={draft.declarations.privacyNotice}
            onChange={(v) => onDeclaration("privacyNotice", v)}
            error={errors["declarations.privacyNotice"]}
            label={
              <>
                I have read the{" "}
                <Link href="/legal/data-processing" target="_blank" className="font-semibold text-forest-600 underline underline-offset-4">
                  recruitment data-processing notice (opens in a new tab)
                </Link>{" "}
                and understand how my information will be used.
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
