import { Container } from "@/components/ui/Container";

type Stat = { value: string; label: string; source: string };

/**
 * Renders only when the client supplies verified figures (src/content/site.ts).
 * Each figure keeps its source so it can be checked before publishing.
 */
export function StatsBand({ stats }: { stats: readonly Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section aria-label="Key figures" className="border-b border-stone-300 bg-stone-100">
      <Container>
        <dl className="grid grid-cols-2 divide-stone-300 md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="py-8 md:px-6 md:first:pl-0">
              <dt className="text-sm text-stone-500">{s.label}</dt>
              <dd className="mt-1 font-display text-5xl font-bold text-forest-800">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
