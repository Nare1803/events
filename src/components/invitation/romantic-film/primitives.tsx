import Image from "next/image";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { EdgeCode, FrameCorners, SprocketEdges } from "./ornaments";

export type Tone = "light" | "dark";
/** A light leak: a 360px radial wash centred on one corner of the screen. */
export type Leak = `${"tl" | "tr" | "bl" | "br"}-${"amber" | "rose"}`;

/**
 * Background layers, back to front: ground (the section's own background),
 * light leaks, grain. Text sits above all of them, so grain never touches a
 * letter and every text colour keeps its exact contrast.
 */
export function Atmosphere({ leaks = [] }: { leaks?: Leak[] }) {
  return (
    <>
      {leaks.map((leak) => (
        <span key={leak} className={`rf-leak rf-leak-${leak}`} aria-hidden="true" />
      ))}
      <span className="rf-grain" aria-hidden="true" />
    </>
  );
}

/**
 * One screen of the film: a full-width band on paper (light) or in darkness
 * (dark) with its grain and leaks, the content, and the frame number and
 * timecode at the foot. `fill` makes it at least one phone screen tall with
 * the content centred. Content caps at 1152px on desktop.
 */
export function Screen({
  id,
  labelledBy,
  as: Tag = "section",
  tone,
  n,
  leaks,
  fill = false,
  seam = false,
  edges = false,
  centerCode = false,
  className,
  style,
  children,
}: {
  id?: string;
  labelledBy?: string;
  as?: ElementType;
  tone: Tone;
  /** Frame number: the label rule and "0n · 00:0n:00:00" at the foot. */
  n: number;
  leaks?: Leak[];
  fill?: boolean;
  /** A thin strip of film across the top, between two paper screens. */
  seam?: boolean;
  /** Sprocket bands down both sides (intro and closing). */
  edges?: boolean;
  centerCode?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      // data-rf-dark lets the floating controls switch to their dark version over this screen.
      {...(tone === "dark" ? { "data-rf-dark": edges ? "edge" : "" } : {})}
      className={cn("rf-screen relative isolate overflow-clip", tone === "dark" ? "rf-dark" : "rf-light", fill && "min-h-svh")}
      style={style}
    >
      <Atmosphere leaks={leaks} />
      {seam && <span className="rf-seam" aria-hidden="true" />}
      {edges && <SprocketEdges />}
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[78rem] flex-col pb-10 pt-[84px] lg:px-12 lg:pb-14 lg:pt-28",
          edges ? "px-11" : "px-6",
          fill && "min-h-svh",
        )}
      >
        <div className={cn("flex flex-1 flex-col", fill && "justify-center", className)}>{children}</div>
        <EdgeCode n={n} className={cn("mt-16 lg:mt-20", centerCode && "text-center")} />
      </div>
    </Tag>
  );
}

/**
 * A letterboxed still: a 22px night bar carrying the frame code ("06A") and
 * three perforations, the photo, then an 8px bar. `corners` draws the frame
 * corners inside the photo (dress code).
 */
export function Still({
  src,
  alt,
  code,
  sizes,
  corners = false,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  code: string;
  sizes: string;
  corners?: boolean;
  className?: string;
  /** The photo crop, e.g. "aspect-[358/136] lg:aspect-[19/10]". */
  imageClassName: string;
}) {
  return (
    <figure className={cn("rf-still overflow-hidden rounded-[2px] bg-rf-night", className)}>
      <div className="flex h-[22px] items-center justify-between px-2.5">
        <span className="rf-frame-code">{code}</span>
        <span className="flex gap-[3px]" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[7px] w-1 rounded-[1px] bg-rf-cream" />
          ))}
        </span>
      </div>
      <div className={cn("relative overflow-hidden bg-rf-night-2", imageClassName)}>
        <Image src={src} alt={alt} fill sizes={sizes} quality={80} className="object-cover" />
        {corners && <FrameCorners offset={-10} className="[--rf-orn:var(--rf-amber)]" />}
      </div>
      <div className="h-2" />
    </figure>
  );
}

/**
 * "Anna & David" as the film's title, in capitals with the rose italic
 * ampersand. Stacked; on one line from `lg` with `inlineLg`. One name for a
 * one-host event. Long names shrink to fit (no JS: --rf-fit is the longest
 * line in characters).
 */
export function TitleNames({
  one,
  two,
  as: Tag = "p",
  id,
  inlineLg = false,
  className,
  style,
}: {
  one: string;
  two: string;
  inlineLg?: boolean;
  as?: ElementType;
  id?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const pair = !!two.trim();
  const fit = {
    "--rf-fit": Math.max(4, one.length, two.length),
    "--rf-fit-line": Math.max(4, pair ? one.length + two.length + 3 : one.length),
    ...style,
  } as CSSProperties;
  if (!pair) {
    return (
      <Tag id={id} className={cn("rf-names rf-names-one", className)} style={fit}>
        {one}
      </Tag>
    );
  }
  const line = inlineLg ? "block lg:inline" : "block";
  return (
    <Tag id={id} className={cn("rf-names", className)} style={fit}>
      <span className={line}>{one}</span> <span className={cn("rf-amp", line)}>&amp;</span> <span className={line}>{two}</span>
    </Tag>
  );
}

/** "For Naz", with the name in rose, from the dictionary's "For {name}". */
export function ForGuest({ template, name, className }: { template: string; name: string; className?: string }) {
  const [before, after = ""] = template.split("{name}");
  return (
    <p className={className}>
      {before}
      <span className="text-rf-rose">{name}</span>
      {after}
    </p>
  );
}

/** Entrance tied to the intro closing (the shell's data-opened). */
export const enter = (delay: number, className = "") => ({
  className: `opacity-0 group-data-[opened=true]/inv:animate-rf-rise ${className}`,
  style: { animationDelay: `${delay}ms` } as CSSProperties,
});
