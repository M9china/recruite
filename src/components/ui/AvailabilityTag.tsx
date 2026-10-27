import type { Availability } from "@/lib/domain/opportunity";

const config: Record<Availability, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-forest-800 text-white" },
  CLOSING_SOON: { label: "Closing soon", className: "bg-sand-400 text-charcoal-900" },
  NOT_YET_OPEN: { label: "Opens soon", className: "border border-stone-500 text-stone-500" },
  CLOSED: { label: "Closed", className: "bg-stone-100 text-stone-500" },
};

/** Availability is always spelled out in words, never signalled by colour alone. */
export function AvailabilityTag({ availability }: { availability: Availability }) {
  const { label, className } = config[availability];
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-control)] px-2.5 py-1 text-sm font-semibold leading-none ${className}`}
    >
      {label}
    </span>
  );
}
