"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { ErrorSummary, RadioGroup } from "@/components/form/fields";
import { DocumentsStep } from "./DocumentsStep";
import {
  buildSubmission,
  COMPACT_ON_STEP,
  compactDraft,
  type Draft,
  emptyDraft,
  fromServerErrors,
  getIn,
  setIn,
  stepIndexForPath,
  STEPS,
  type UploadedDocument,
  validateStep,
} from "./model";
import { AddressStep, type Bind, ParentsStep, PersonalStep, WorkStep } from "./QuestionSteps";
import { ReviewStep } from "./ReviewStep";
import { uuidV4 } from "@/lib/uuid";

export type RoleOption = { slug: string; title: string; category: string; closes: string | null };

type Props = { roles: RoleOption[]; initialRole?: string };

/**
 * Answers (not files) are kept in sessionStorage so a refresh or a dropped
 * connection doesn't lose them. sessionStorage is cleared when the tab closes,
 * and on successful submission.
 */
const STORAGE_KEY = "application-draft-v1";

type Saved = { draft: Draft; uploads: UploadedDocument[]; stepIndex: number; idempotencyKey: string };

function loadSaved(): Saved | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

function clearSaved() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function ApplicationForm({ roles, initialRole }: Props) {
  const router = useRouter();
  const validInitialRole = roles.some((r) => r.slug === initialRole) ? initialRole! : "";

  const [draft, setDraft] = useState<Draft>(() => emptyDraft(validInitialRole));
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [focusTarget, setFocusTarget] = useState<"heading" | "summary" | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Restore a saved draft once, after hydration.
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      const role = validInitialRole || saved.draft.opportunitySlug;
      setDraft({ ...saved.draft, opportunitySlug: roles.some((r) => r.slug === role) ? role : "" });
      setUploads(saved.uploads ?? []);
      setStepIndex(Math.min(Math.max(saved.stepIndex ?? 0, 0), STEPS.length - 1));
      setIdempotencyKey(saved.idempotencyKey || uuidV4());
    } else {
      setIdempotencyKey(uuidV4());
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      const saved: Saved = { draft, uploads, stepIndex, idempotencyKey };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* storage full or unavailable: the form still works */
    }
  }, [draft, uploads, stepIndex, idempotencyKey, restored]);

  // Release photo previews when leaving the page.
  const previewsRef = useRef(previews);
  previewsRef.current = previews;
  useEffect(() => () => Object.values(previewsRef.current).forEach((u) => URL.revokeObjectURL(u)), []);

  // Move focus after a step change or a failed Continue, for keyboard and screen-reader users.
  useEffect(() => {
    if (!focusTarget) return;
    topRef.current?.scrollIntoView({ block: "start" });
    if (focusTarget === "summary") document.getElementById("error-summary")?.focus();
    else headingRef.current?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const clearError = useCallback((path: string) => {
    setErrors((e) => {
      if (!(path in e)) return e;
      return omit(e, path);
    });
  }, []);

  const bind: Bind = (path) => ({
    path,
    value: String(getIn(draft.questionnaire, path) ?? ""),
    error: errors[path],
    onChange: (value: string) => {
      setDraft((d) => setIn(d, `questionnaire.${path}`, value));
      clearError(path);
    },
  });

  const setList = (path: string, list: unknown[]) => {
    setDraft((d) => setIn(d, `questionnaire.${path}`, list));
    // Indexes shift when a row is removed, so clear that list's errors.
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(path))));
  };

  const step = STEPS[stepIndex]!;
  const role = roles.find((r) => r.slug === draft.opportunitySlug);

  function goTo(index: number) {
    setErrors({});
    setFormError(null);
    setStepIndex(index);
    setFocusTarget("heading");
  }

  function showErrors(next: Record<string, string>) {
    setErrors(next);
    setFocusTarget("summary");
  }

  function next() {
    const compacted = compactDraft(draft, COMPACT_ON_STEP[step.key] ?? []);
    setDraft(compacted);
    const stepErrors = validateStep(step.key, compacted, { uploads, uploading });
    if (Object.keys(stepErrors).length > 0) return showErrors(stepErrors);
    goTo(stepIndex + 1);
  }

  async function submit() {
    const compacted = compactDraft(draft);
    setDraft(compacted);
    // Check every step again before sending.
    for (let i = 0; i < STEPS.length; i++) {
      const stepErrors = validateStep(STEPS[i]!.key, compacted, { uploads, uploading });
      if (Object.keys(stepErrors).length > 0) {
        if (i !== stepIndex) setStepIndex(i);
        return showErrors(stepErrors);
      }
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/public/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmission(compacted, uploads, idempotencyKey, website)),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.referenceNumber) {
        clearSaved();
        router.push(`/apply/confirmation?ref=${encodeURIComponent(data.referenceNumber)}`);
        return;
      }
      const error = data?.error as { code?: string; message?: string; fieldErrors?: Record<string, string[]> } | undefined;
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        const mapped = fromServerErrors(error.fieldErrors);
        const target = Math.min(...Object.keys(mapped).map(stepIndexForPath));
        const forStep = Object.fromEntries(Object.entries(mapped).filter(([k]) => stepIndexForPath(k) === target));
        setStepIndex(target);
        setFormError(error.message ?? null);
        return showErrors(forStep);
      }
      setFormError(error?.message ?? "Your application could not be submitted. Try again.");
      setFocusTarget("heading");
    } catch {
      setFormError(
        "Your application could not be sent. Check your internet connection and try again. Your answers are kept on this device until you close this tab.",
      );
      setFocusTarget("heading");
    } finally {
      setSubmitting(false);
    }
  }

  const stepProps = { q: draft.questionnaire, bind, errors, setList };

  return (
    <div ref={topRef} className="scroll-mt-28 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
      <nav aria-label="Application progress" className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-sm text-stone-500 lg:hidden">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <div className="mt-2 h-1.5 bg-stone-100 lg:hidden" aria-hidden="true">
          <div className="h-full bg-forest-800 transition-[width] duration-300" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="hidden border-l-2 border-stone-300 lg:block">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              aria-current={i === stepIndex ? "step" : undefined}
              className={`-ml-0.5 border-l-2 py-2 pl-4 ${
                i === stepIndex
                  ? "border-forest-800 font-semibold text-charcoal-900"
                  : i < stepIndex
                    ? "border-stone-300 text-forest-600"
                    : "border-stone-300 text-stone-500"
              }`}
            >
              <span className="sr-only">{i < stepIndex ? "Completed: " : i === stepIndex ? "Current: " : "Not started: "}</span>
              {s.title}
            </li>
          ))}
        </ol>
      </nav>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step.key === "review") void submit();
          else next();
        }}
        className="min-w-0"
      >
        <h2 ref={headingRef} tabIndex={-1} className="text-4xl leading-none outline-none md:text-5xl">
          <span className="sr-only">
            Step {stepIndex + 1} of {STEPS.length}:{" "}
          </span>
          {step.title}
        </h2>

        <div className="mt-8">
          {formError ? (
            <p role="alert" className="mb-8 border-l-4 border-alert-600 bg-stone-100 px-5 py-4 font-semibold">
              {formError}
            </p>
          ) : null}
          <ErrorSummary errors={errors} />

          {step.key === "role" ? (
            <div className="space-y-8">
              <div className="border-l-4 border-sand-400 bg-stone-100 px-5 py-4">
                <h3 className="font-sans text-lg font-bold">Before you start</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Answer all questions truthfully and carefully.</li>
                  <li>If you answer “Yes”, give all the additional information asked for under that question.</li>
                  <li>All information must match your documents.</li>
                  <li>You will need a head-and-shoulders photo on a plain white background.</li>
                </ul>
              </div>
              <RadioGroup
                path="opportunitySlug"
                legend="Which role are you applying for?"
                options={roles.map((r) => ({
                  value: r.slug,
                  label: `${r.title} (${r.category})${r.closes ? `, closes ${r.closes}` : ""}`,
                }))}
                value={draft.opportunitySlug}
                error={errors.opportunitySlug}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, opportunitySlug: v }));
                  clearError("opportunitySlug");
                }}
              />
            </div>
          ) : null}
          {step.key === "personal" ? <PersonalStep {...stepProps} /> : null}
          {step.key === "parents" ? <ParentsStep {...stepProps} /> : null}
          {step.key === "address" ? <AddressStep {...stepProps} /> : null}
          {step.key === "work" ? <WorkStep {...stepProps} /> : null}
          {step.key === "documents" ? (
            <DocumentsStep
              uploads={uploads}
              onChange={(update) => {
                setUploads(update);
                clearError("documents");
              }}
              onUploadingChange={(delta) => setUploading((n) => n + delta)}
              previews={previews}
              onPreview={(token, url) =>
                setPreviews((p) => {
                  if (p[token]) URL.revokeObjectURL(p[token]);
                  const rest = omit(p, token);
                  return url ? { ...rest, [token]: url } : rest;
                })
              }
              error={errors.documents}
            />
          ) : null}
          {step.key === "review" ? (
            <ReviewStep
              draft={draft}
              roleTitle={role?.title ?? ""}
              uploads={uploads}
              errors={errors}
              onEdit={goTo}
              onDeclaration={(key, value) => {
                setDraft((d) => ({ ...d, declarations: { ...d.declarations, [key]: value } }));
                clearError(`declarations.${key}`);
              }}
            />
          ) : null}
        </div>

        {/* Honeypot: hidden from people and assistive technology; bots that fill it are rejected. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="mt-12 flex flex-col-reverse gap-3 border-t border-stone-300 pt-8 sm:flex-row sm:justify-between">
          {stepIndex > 0 ? (
            <button type="button" onClick={() => goTo(stepIndex - 1)} className={buttonClasses("outline")} disabled={submitting}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className={buttonClasses("primary", "disabled:cursor-wait disabled:opacity-60")}
            disabled={submitting || (step.key === "documents" && uploading > 0) || !idempotencyKey}
          >
            {step.key === "review" ? (submitting ? "Submitting…" : "Submit application") : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
