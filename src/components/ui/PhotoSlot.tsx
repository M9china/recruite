import Image from "next/image";
import type { ImageRef } from "@/content/types";

type Props = {
  image?: ImageRef;
  /** What the photograph should show; displayed while no licensed image is supplied. */
  brief: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Renders a licensed photo when one is supplied, otherwise a deliberate
 * placeholder (contour texture + the photo brief) so layouts can be reviewed
 * without stock imagery. Parent must be positioned and sized.
 */
export function PhotoSlot({ image, brief, className = "", priority, sizes = "100vw" }: Props) {
  if (image) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`absolute inset-0 overflow-hidden bg-forest-800 ${className}`} role="img" aria-label={`Photo placeholder: ${brief}`}>
      <svg className="absolute inset-0 h-full w-full text-sand-400/15" aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 500">
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M-20 420 C120 360 220 440 360 380 S600 300 820 360" />
          <path d="M-20 380 C130 320 230 400 370 340 S610 260 820 320" />
          <path d="M-20 340 C140 280 240 360 380 300 S620 220 820 280" />
          <path d="M-20 300 C150 240 250 320 390 260 S630 180 820 240" />
          <path d="M-20 260 C160 200 260 280 400 220 S640 140 820 200" />
          <path d="M-20 220 C170 160 270 240 410 180 S650 100 820 160" />
          <path d="M-20 180 C180 120 280 200 420 140 S660 60 820 120" />
          <path d="M-20 140 C190 80 290 160 430 100 S670 20 820 80" />
          <ellipse cx="560" cy="250" rx="70" ry="40" />
          <ellipse cx="560" cy="250" rx="40" ry="22" />
        </g>
      </svg>
      <p className="absolute bottom-3 right-4 max-w-[60%] text-right text-xs text-stone-100/60">Photo to supply: {brief}</p>
    </div>
  );
}
