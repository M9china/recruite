"use client";

import { Conditional, ErrorText, fieldId, RadioGroup, TextField } from "@/components/form/fields";
import {
  HAS_SPOUSE,
  MARITAL_STATUS_LABELS,
  MAX_EMAILS,
  MAX_HISTORY_ENTRIES,
  MAX_PHONES,
  type MaritalStatus,
  WORK_STATUS_LABELS,
} from "@/lib/validation/questionnaire";
import { type Draft, emptyHistory } from "./model";

/** Binds a questionnaire path to a field: value, error and change handler. */
export type Bind = (path: string) => { path: string; value: string; error?: string; onChange: (value: string) => void };

type StepProps = {
  q: Draft["questionnaire"];
  bind: Bind;
  errors: Record<string, string>;
  setList: (path: string, list: unknown[]) => void;
};

const YES_NO = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
] as const;

const maritalOptions = Object.entries(MARITAL_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const workOptions = Object.entries(WORK_STATUS_LABELS).map(([value, label]) => ({ value, label }));

const smallButton =
  "inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-forest-800 px-4 font-semibold text-forest-800 hover:bg-forest-800 hover:text-white";
const removeButton = "font-semibold text-alert-600 underline underline-offset-4";

// ---------------------------------------------------------------------------
// Step: about you (questions 1–3, 6–7)
// ---------------------------------------------------------------------------

export function PersonalStep({ q, bind }: StepProps) {
  const hasSpouse = HAS_SPOUSE.has(q.personal.maritalStatus as MaritalStatus);
  return (
    <div className="space-y-8">
      <TextField {...bind("personal.surname")} label="Surname" autoComplete="family-name" width="medium" />
      <TextField {...bind("personal.firstName")} label="First name" autoComplete="given-name" width="medium" />
      <TextField {...bind("personal.middleName")} label="Middle name" optional autoComplete="additional-name" width="medium" />
      <RadioGroup {...bind("personal.maritalStatus")} legend="Marital status" options={maritalOptions}>
        <Conditional show={hasSpouse}>
          <fieldset className="space-y-6">
            <legend className="text-lg font-semibold">Place of birth of your spouse or partner</legend>
            <TextField {...bind("personal.spouse.birthCountry")} label="Country" width="medium" />
            <TextField {...bind("personal.spouse.birthCity")} label="Town or city" width="medium" />
          </fieldset>
          <TextField {...bind("personal.spouse.citizenship")} label="Citizenship of your spouse or partner" width="medium" />
        </Conditional>
      </RadioGroup>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: parents (questions 4–5)
// ---------------------------------------------------------------------------

function ParentFields({ who, q, bind }: { who: "father" | "mother" } & Pick<StepProps, "q" | "bind">) {
  const p = `parents.${who}`;
  return (
    <RadioGroup {...bind(`${p}.has`)} legend={`Do you have a ${who}?`} options={YES_NO} inline>
      <Conditional show={q.parents[who].has === "YES"}>
        <p className="text-stone-500">Give your {who}&apos;s details.</p>
        <TextField {...bind(`${p}.details.surname`)} label="Surname" width="medium" />
        <TextField {...bind(`${p}.details.firstNames`)} label="First name or names" width="medium" />
        <TextField {...bind(`${p}.details.middleName`)} label="Middle name" optional width="medium" />
        <TextField
          {...bind(`${p}.details.dateOfBirth`)}
          label="Date of birth"
          type="date"
          width="short"
          max={new Date().toISOString().slice(0, 10)}
          min="1900-01-01"
        />
        <TextField {...bind(`${p}.details.placeOfBirth`)} label="Place of birth" hint="Town or city, and country" width="medium" />
      </Conditional>
    </RadioGroup>
  );
}

export function ParentsStep(props: StepProps) {
  return (
    <div className="space-y-12">
      <ParentFields who="father" {...props} />
      <ParentFields who="mother" {...props} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: address and contact (questions 8–10)
// ---------------------------------------------------------------------------

function RepeatableList({
  path,
  legend,
  hint,
  itemLabel,
  values,
  max,
  type,
  autoComplete,
  bind,
  errors,
  setList,
}: {
  path: string;
  legend: string;
  hint: string;
  itemLabel: string;
  values: string[];
  max: number;
  type: "tel" | "email";
  autoComplete: string;
} & Pick<StepProps, "bind" | "errors" | "setList">) {
  return (
    <fieldset id={fieldId(path)} tabIndex={-1} className={errors[path] ? "border-l-4 border-alert-600 pl-4" : ""}>
      <legend className="text-2xl font-display font-semibold">{legend}</legend>
      <p className="mt-1 text-stone-500">{hint}</p>
      <ErrorText id={fieldId(path)} error={errors[path]} />
      <div className="mt-5 space-y-5">
        {values.map((_, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <div className="grow sm:max-w-sm">
              <TextField
                {...bind(`${path}.${i}`)}
                label={values.length > 1 ? `${itemLabel} ${i + 1}` : itemLabel}
                type={type}
                inputMode={type}
                autoComplete={i === 0 ? autoComplete : "off"}
              />
            </div>
            {values.length > 1 ? (
              <button type="button" className={`${removeButton} self-start sm:mb-3 sm:self-auto`} onClick={() => setList(path, values.filter((__, j) => j !== i))}>
                Remove<span className="sr-only"> {`${itemLabel.toLowerCase()} ${i + 1}`}</span>
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {values.length < max ? (
        <button type="button" className={`${smallButton} mt-5`} onClick={() => setList(path, [...values, ""])}>
          Add another {itemLabel.toLowerCase()}
        </button>
      ) : null}
    </fieldset>
  );
}

export function AddressStep({ q, bind, errors, setList }: StepProps) {
  return (
    <div className="space-y-12">
      <RadioGroup
        {...bind("residence.status")}
        legend="Do you currently have a place of actual residence?"
        options={[
          { value: "YES", label: "Yes" },
          { value: "NONE", label: "I do not have a permanent place of residence" },
        ]}
      >
        <Conditional show={q.residence.status === "YES"}>
          <p className="text-stone-500">Give your full address.</p>
          <TextField {...bind("residence.address.country")} label="Country" autoComplete="country-name" width="medium" />
          <TextField {...bind("residence.address.postalCode")} label="Postal code" autoComplete="postal-code" width="short" />
          <TextField {...bind("residence.address.city")} label="City or town" autoComplete="address-level2" width="medium" />
          <TextField {...bind("residence.address.street")} label="Street" autoComplete="address-line1" />
          <TextField {...bind("residence.address.building")} label="House or building number" width="short" />
          <TextField {...bind("residence.address.apartment")} label="Apartment" optional autoComplete="address-line2" width="short" />
        </Conditional>
      </RadioGroup>

      <RepeatableList
        path="contact.phones"
        legend="Your telephone number"
        hint="If you have several phone numbers, add all of them. Include the country code if you are outside South Africa."
        itemLabel="Phone number"
        values={q.contact.phones}
        max={MAX_PHONES}
        type="tel"
        autoComplete="tel"
        bind={bind}
        errors={errors}
        setList={setList}
      />

      <RepeatableList
        path="contact.emails"
        legend="Your email address"
        hint="If you have several email addresses, add all of them. We will use the first one to contact you."
        itemLabel="Email address"
        values={q.contact.emails}
        max={MAX_EMAILS}
        type="email"
        autoComplete="email"
        bind={bind}
        errors={errors}
        setList={setList}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: work and education (question 11)
// ---------------------------------------------------------------------------

export function WorkStep({ q, bind, errors, setList }: StepProps) {
  const history = q.work.history;
  return (
    <RadioGroup {...bind("work.status")} legend="Are you currently working or have you worked previously?" options={workOptions}>
      <Conditional show={q.work.status === "YES"}>
        <div id={fieldId("work.history")} tabIndex={-1}>
          <p className="text-stone-500">
            Give at least your two most recent places of employment or education, starting with the most recent.
          </p>
          <ErrorText id={fieldId("work.history")} error={errors["work.history"]} />
        </div>
        {history.map((_, i) => (
          <fieldset key={i} className="space-y-6 border-t border-stone-300 pt-6">
            <legend className="float-left mb-2 w-full font-display text-2xl font-semibold">
              Place of employment or education {i + 1}
            </legend>
            <TextField {...bind(`work.history.${i}.organisation`)} label="Organisation name" />
            <TextField {...bind(`work.history.${i}.role`)} label="Position or field of study" width="medium" />
            <TextField {...bind(`work.history.${i}.address`)} label="Address" />
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField {...bind(`work.history.${i}.from`)} label="From" type="month" hint="Month and year, for example 2021-03" />
              <TextField
                {...bind(`work.history.${i}.to`)}
                label="To"
                type="month"
                optional
                hint="Leave blank if you are still there"
              />
            </div>
            {history.length > 1 ? (
              <button type="button" className={removeButton} onClick={() => setList("work.history", history.filter((__, j) => j !== i))}>
                Remove place {i + 1}
              </button>
            ) : null}
          </fieldset>
        ))}
        {history.length < MAX_HISTORY_ENTRIES ? (
          <button type="button" className={smallButton} onClick={() => setList("work.history", [...history, emptyHistory()])}>
            Add another place
          </button>
        ) : null}
      </Conditional>
    </RadioGroup>
  );
}
