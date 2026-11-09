import Image from "next/image";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { OldMoneyTone } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import { EngravedBorder, LabelRule } from "./ornaments";

/**
 * One "screen" of the invitation: a full-width band (its ground colour) with a
 * framed box inside. On phones the box is the screen; on desktop it is a
 * centred column (≈640px of content) or, for `wide`, up to 1200px.
 */
export function Screen({
  id,
  labelledBy,
  as: Tag = "section",
  tone = "light",
  wide = false,
  cards = false,
  band = "bg-inv-bg",
  box,
  className,
  style,
  children,
}: {
  id?: string;
  labelledBy?: string;
  as?: ElementType;
  tone?: OldMoneyTone;
  wide?: boolean;
  /** Screens holding cards use 32px sides instead of 40px (spec sheet). */
  cards?: boolean;
  /** Classes for the full-width band (ground colour). */
  band?: string;
  /** Classes for the framed box. */
  box?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    // data-om-dark lets the floating controls switch to their night version over this screen.
    <Tag id={id} aria-labelledby={labelledBy} className={cn("lg:py-10", band)} style={style} {...(tone === "dark" ? { "data-om-dark": "" } : {})}>
      <div
        className={cn(
          "relative isolate mx-auto w-full pb-[4.5rem] pt-24",
          cards ? "px-8" : "px-10",
          wide ? "lg:max-w-[75rem] lg:px-16 lg:py-20" : "lg:max-w-[45rem] lg:px-20 lg:py-20",
          box,
          className,
        )}
      >
        <EngravedBorder tone={tone} className="absolute inset-0 -z-10" />
        {children}
      </div>
    </Tag>
  );
}

/** Small-caps label → title → label rule (6px · 6px), centred. With no title the label is the heading. */
export function SectionHeader({ id, label, title, tone = "light" }: { id: string; label?: string; title?: string; tone?: OldMoneyTone }) {
  return (
    <header className="flex flex-col items-center text-center">
      {title ? (
        <>
          {label && <p className="om-label">{label}</p>}
          <h2 id={id} className="om-title mt-1.5">
            {title}
          </h2>
        </>
      ) : (
        <h2 id={id} className="om-label">
          {label}
        </h2>
      )}
      <LabelRule tone={tone} className="mt-1.5" />
    </header>
  );
}

/** "Anna & David" with the ampersand in green italic; a single name for one-host events. */
export function Names({ one, two }: { one: string; two: string }) {
  if (!two.trim()) return <>{one}</>;
  return (
    <>
      {one} <span className="om-amp">&amp;</span> {two}
    </>
  );
}

/** Entrance animation tied to the intro opening (the shell's data-opened). */
export const enter = (delay: number, className = "") => ({
  className: `opacity-0 group-data-[opened=true]/inv:animate-rise ${className}`,
  style: { animationDelay: `${delay}ms` },
});

/** Photo in a 1px gold frame with a 5px gap; `hero` adds the 0.5px navy line inside. Square corners only. */
export function FramedPhoto({
  src,
  alt,
  aspect,
  sizes,
  hero = false,
  gap = 5,
  preload,
  className,
}: {
  src: string;
  alt: string;
  aspect: string;
  sizes: string;
  hero?: boolean;
  gap?: number;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("border border-om-gold", className)} style={{ padding: gap }}>
      <div className="relative overflow-hidden bg-om-linen" style={{ aspectRatio: aspect }}>
        <Image src={src} alt={alt} fill preload={preload} sizes={sizes} quality={80} className="object-cover" />
        {hero && <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_0.5px_var(--inv-text)]" aria-hidden="true" />}
      </div>
    </div>
  );
}

/** Wraps children in the dark (night) palette. */
export function NightLabel({ as: Tag = "p", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  return <Tag className={cn("om-label text-[color:var(--inv-muted)]", className)}>{children}</Tag>;
}
