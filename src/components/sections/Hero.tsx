import { ButtonLink } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import type { ImageRef } from "@/content/types";

type Props = { headline: string; lede: string; image?: ImageRef };

/**
 * Homepage hero: full-bleed photograph with an oversized condensed headline
 * set low and left. Pulled up under the transparent header (72px).
 */
export function Hero({ headline, lede, image }: Props) {
  return (
    <section aria-labelledby="hero-title" className="relative -mt-[72px] flex min-h-[min(92svh,860px)] items-end overflow-hidden bg-forest-800 text-white">
      <PhotoSlot image={image} brief="recruits in training, natural light, faces visible, wide shot" priority />
      {/* Darkens only the lower-left, where the text sits. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,31,29,0.92)_0%,rgba(28,31,29,0.55)_45%,rgba(28,31,29,0.15)_75%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-14 pt-40 sm:px-8 md:pb-20">
        <h1 id="hero-title" className="max-w-[11ch] text-[clamp(3.25rem,9vw,7.5rem)] font-bold leading-[0.88] tracking-[-0.01em]">
          {headline}
        </h1>
        <div className="mt-8 flex flex-col gap-8 border-t border-sand-400/60 pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg text-stone-100 md:text-xl">{lede}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/careers" variant="accent">
              Explore careers
            </ButtonLink>
            <ButtonLink href="/apply" variant="outline-light">
              Apply now
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
