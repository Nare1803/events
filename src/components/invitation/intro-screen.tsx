"use client";

import { interpolate, type Dictionary } from "@/lib/i18n";
import type { IntroVariant } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";

export type IntroPhase = "closed" | "opening" | "open";

type IntroScreenProps = {
  phase: IntroPhase;
  variant: IntroVariant;
  guestName: string | null;
  partnerOne: string;
  partnerTwo: string;
  label: string;
  inviteLine: string;
  dotDate: string;
  dateISO: string;
  t: Dictionary;
  onOpen: () => void;
};

const rise = (delay: number) => ({ style: { animationDelay: `${delay}ms` } });

/**
 * The first five seconds: a quiet, framed card that addresses the guest by name.
 * Tapping "Open invitation" lifts the veil (or fades the letter) into the hero and
 * doubles as the user gesture that browsers require before music can play.
 */
export function IntroScreen({ phase, variant, guestName, partnerOne, partnerTwo, label, inviteLine, dotDate, dateISO, t, onOpen }: IntroScreenProps) {
  if (phase === "open") return null;
  const opening = phase === "opening";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-names"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-inv-bg text-inv-text",
        variant === "veil"
          ? "transition-[clip-path] duration-[1300ms] ease-[var(--ease-curtain)] [clip-path:inset(0_0_0_0)]"
          : "transition-opacity duration-1000 ease-[var(--ease-editorial)]",
        opening && (variant === "veil" ? "[clip-path:inset(0_0_100%_0)] delay-300" : "opacity-0 delay-300"),
      )}
    >
      {/* Hairline frame */}
      <div className="pointer-events-none absolute inset-3 border border-inv-line sm:inset-6" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-5 border border-inv-line/60 sm:inset-8" aria-hidden="true" />

      <div
        className={cn(
          "relative flex max-w-lg flex-col items-center px-8 text-center transition-all duration-700 ease-[var(--ease-editorial)]",
          opening && "-translate-y-4 opacity-0",
        )}
      >
        <p {...rise(200)} className="animate-rise inv-eyebrow text-inv-accent">
          {guestName ? interpolate(t.intro.forGuest, { name: guestName }) : label}
        </p>

        <h1 id="intro-names" className="inv-display mt-10 text-[clamp(3.25rem,15vw,6.5rem)] leading-[0.95]">
          <span {...rise(500)} className="animate-rise block">
            {partnerOne}
          </span>
          {partnerTwo && (
            <>
              <span {...rise(700)} className="animate-rise my-1 block font-serif text-[0.5em] italic text-inv-accent">
            &amp;
          </span>
          <span {...rise(900)} className="animate-rise block">
            {partnerTwo}
          </span>
            </>
          )}
        </h1>

        <p {...rise(1150)} className="animate-rise mt-8 max-w-xs font-serif text-lg italic leading-snug text-inv-muted sm:text-xl">
          {inviteLine}
        </p>

        <span {...rise(1300)} className="animate-rise my-8 block h-10 w-px bg-inv-line" aria-hidden="true" />

        <p {...rise(1400)} className="animate-rise inv-eyebrow text-xs tracking-[0.42em]">
          <time dateTime={dateISO}>{dotDate}</time>
        </p>

        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          {...rise(1600)}
          className="animate-rise inv-button mt-12"
        >
          {opening ? t.intro.opening : t.intro.open}
        </button>
      </div>
    </div>
  );
}
