"use client";

import type { ReactNode } from "react";

/**
 * Form controls with the accessibility wiring done once: every control has a
 * visible label, hints and errors are linked with aria-describedby, and
 * errors are prefixed for screen readers.
 */

export const fieldId = (path: string) => `f-${path.replace(/\./g, "-")}`;

const inputBase =
  "mt-2 block w-full rounded-[var(--radius-control)] border bg-white px-3.5 py-2 text-base text-charcoal-900 placeholder:text-stone-500 focus:outline-2 focus:outline-offset-0 focus:outline-sand-400";

function describedBy(id: string, hint?: string, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 font-semibold text-alert-600">
      <span className="sr-only">Error: </span>
      {error}
    </p>
  );
}

type TextFieldProps = {
  path: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: "text" | "email" | "tel" | "date" | "month";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  width?: "full" | "medium" | "short";
  max?: string;
  min?: string;
};

const widths = { full: "", medium: "sm:max-w-sm", short: "sm:max-w-[12rem]" };

export function TextField({
  path,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  type = "text",
  autoComplete,
  inputMode,
  width = "full",
  max,
  min,
}: TextFieldProps) {
  const id = fieldId(path);
  return (
    <div className={error ? "border-l-4 border-alert-600 pl-4" : ""}>
      <label htmlFor={id} className="block text-lg font-semibold">
        {label}
        {optional ? <span className="font-normal text-stone-500"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-stone-500">
          {hint}
        </p>
      ) : null}
      <ErrorText id={id} error={error} />
      <input
        id={id}
        name={path}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        max={max}
        min={min}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputBase} ${widths[width]} ${error ? "border-alert-600 border-2" : "border-stone-500"}`}
      />
    </div>
  );
}

type Option = { value: string; label: string };

type RadioGroupProps = {
  path: string;
  legend: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  inline?: boolean;
  /** Rendered under the group, e.g. the follow-up questions for "Yes". */
  children?: ReactNode;
};

export function RadioGroup({ path, legend, options, value, onChange, error, hint, inline, children }: RadioGroupProps) {
  const id = fieldId(path);
  return (
    <fieldset
      aria-describedby={describedBy(id, hint, error)}
      className={error ? "border-l-4 border-alert-600 pl-4" : ""}
    >
      <legend className="text-lg font-semibold">{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-stone-500">
          {hint}
        </p>
      ) : null}
      <ErrorText id={id} error={error} />
      <div className={`mt-3 flex gap-3 ${inline ? "flex-row flex-wrap gap-x-8" : "flex-col"}`}>
        {options.map((o, i) => (
          <label key={o.value} htmlFor={i === 0 ? id : `${id}-${o.value}`} className="flex cursor-pointer items-start gap-3 py-1">
            <input
              id={i === 0 ? id : `${id}-${o.value}`}
              type="radio"
              name={path}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-0.5 h-6 w-6 shrink-0 accent-forest-800"
            />
            <span className="text-base">{o.label}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

/** Follow-up questions revealed by an answer, visually tied to it. */
export function Conditional({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return <div className="mt-5 space-y-6 border-l-4 border-stone-300 pl-5">{children}</div>;
}

type CheckboxProps = {
  path: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function Checkbox({ path, label, checked, onChange, error }: CheckboxProps) {
  const id = fieldId(path);
  return (
    <div className={error ? "border-l-4 border-alert-600 pl-4" : ""}>
      <ErrorText id={id} error={error} />
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 accent-forest-800"
        />
        <span>{label}</span>
      </label>
    </div>
  );
}

/** Listed at the top of a step after a failed Continue; each item jumps to its field. */
export function ErrorSummary({ errors, labels }: { errors: Record<string, string>; labels?: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div role="alert" aria-labelledby="error-summary-title" className="mb-10 border-4 border-alert-600 p-5" tabIndex={-1} id="error-summary">
      <h2 id="error-summary-title" className="font-sans text-xl font-bold">
        There is a problem
      </h2>
      <ul className="mt-3 space-y-2">
        {entries.map(([path, message]) => (
          <li key={path}>
            <a href={`#${fieldId(path)}`} className="font-semibold text-alert-600 underline underline-offset-4">
              {labels?.[path] ? `${labels[path]}: ` : ""}
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
