type Props = {
  title: string;
  lede?: string;
  id?: string;
  tone?: "dark" | "light";
  level?: "h2" | "h3";
  action?: React.ReactNode;
};

/** Section title with optional lede and a right-aligned action on wide screens. */
export function SectionHeading({ title, lede, id, tone = "dark", level: Tag = "h2", action }: Props) {
  const ledeColor = tone === "dark" ? "text-stone-500" : "text-stone-100/85";
  return (
    <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Tag id={id} className="text-4xl leading-[1.05] md:text-5xl">
          {title}
        </Tag>
        {lede ? <p className={`mt-4 text-lg ${ledeColor}`}>{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
