import type { ThemeTokens } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";

type TemplatePreviewProps = {
  tokens: ThemeTokens;
  heroVariant: string;
  name?: string;
  className?: string;
  muted?: boolean;
};

/**
 * A miniature phone-screen rendering of a template, drawn from its design
 * tokens — so previews always match the real template. Works in server and
 * client components (no hooks, plain <img> for the tiny hero).
 */
export function TemplatePreview({ tokens, heroVariant, name = "Anna & David", className, muted }: TemplatePreviewProps) {
  const c = tokens.colors;
  const [one, two] = name.split(" & ");
  return (
    <div
      className={cn("relative aspect-[9/16] w-full overflow-hidden", muted && "grayscale-[60%] opacity-70", className)}
      style={{ background: heroVariant === "framed" ? c.background : c.inverseBackground, color: heroVariant === "framed" ? c.text : c.inverseText }}
      aria-hidden="true"
    >
      {heroVariant === "framed" ? (
        <div className="flex h-full flex-col items-center justify-center gap-[6%] px-[12%] text-center">
          <div className="aspect-[3/4] w-[62%] overflow-hidden rounded-t-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
            <img src="/demo/hero.webp" alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <Names one={one} two={two} />
          <span className="text-[0.55em] tracking-[0.35em]">18 · 07 · 2027</span>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative thumbnail */}
          <img src="/demo/hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
          <div className="relative flex h-full flex-col items-center justify-center gap-[5%] px-[10%] text-center">
            <Names one={one} two={two} />
            <span className="text-[0.55em] tracking-[0.35em]">18 · 07 · 2027</span>
          </div>
        </>
      )}
    </div>
  );
}

function Names({ one, two }: { one: string; two?: string }) {
  return (
    <span className="font-serif text-[2.6em] font-light leading-[0.95]">
      {one}
      {two && (
        <>
          <span className="block text-[0.5em] italic">&amp;</span>
          {two}
        </>
      )}
    </span>
  );
}
