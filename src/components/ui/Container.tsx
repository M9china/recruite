type Props = { children: React.ReactNode; className?: string; as?: "div" | "section" | "header" | "footer" };

/** 1200px content column with the 16px mobile gutter from the design system. */
export function Container({ children, className = "", as: Tag = "div" }: Props) {
  return <Tag className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</Tag>;
}
