type Item = { id: string; question: string; answer: string };

/**
 * Native <details> disclosure: keyboard and screen-reader accessible without
 * JavaScript, and works before hydration.
 */
export function Accordion({ items }: { items: Item[] }) {
  return (
    <div className="border-t border-stone-300">
      {items.map((item) => (
        <details key={item.id} className="group border-b border-stone-300" id={item.id}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="relative mt-1.5 h-4 w-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-4 before:-translate-y-1/2 before:bg-forest-600 after:absolute after:left-1/2 after:top-0 after:h-4 after:w-0.5 after:-translate-x-1/2 after:bg-forest-600 after:transition-transform after:duration-150 group-open:after:scale-y-0"
            />
          </summary>
          <p className="max-w-[68ch] pb-6 pr-10 text-stone-500">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
