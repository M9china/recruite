import type { ProcessStep } from "@/content/types";

/**
 * The recruitment journey is a true sequence, so it is the one place numerals
 * are used. Compact: horizontal row on wide screens. Full: vertical timeline.
 */
export function ProcessSteps({ steps, variant = "compact" }: { steps: ProcessStep[]; variant?: "compact" | "full" }) {
  if (variant === "compact") {
    return (
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span aria-hidden="true" className="font-display text-6xl font-bold leading-[0.8] text-forest-600/30">
              {i + 1}
            </span>
            <div>
              <h3 className="text-2xl leading-tight">{s.title}</h3>
              <p className="mt-2 text-stone-500">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={s.title} className="relative grid grid-cols-[3.5rem_1fr] gap-6 pb-12 last:pb-0 md:grid-cols-[6rem_1fr]">
          {i < steps.length - 1 ? (
            <span aria-hidden="true" className="absolute bottom-0 left-[1.75rem] top-16 w-px bg-stone-300 md:left-[3rem] md:top-20" />
          ) : null}
          <span
            aria-hidden="true"
            className="text-center font-display text-6xl font-bold leading-none text-forest-600 md:text-8xl"
          >
            {i + 1}
          </span>
          <div className="pt-2 md:pt-4">
            <h2 className="text-3xl leading-tight md:text-4xl">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h2>
            <p className="mt-3 max-w-[60ch] text-lg text-stone-500">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
