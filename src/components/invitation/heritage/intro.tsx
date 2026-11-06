"use client";

import { interpolate } from "@/lib/i18n";
import { heritageStyle } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import type { InvitationView } from "@/types/invitation";
import type { IntroPhase } from "../intro-screen";
import { Frame, Monogram } from "./ornaments";
import { coupleNames, Tr } from "./primitives";

type Props = {
  phase: IntroPhase;
  view: Pick<InvitationView, "event" | "guest" | "t" | "heritage">;
  onOpen: () => void;
};

const MONOGRAM = 200;
const rise = (delay: number) => ({ style: { animationDelay: `${delay}ms` } });

/**
 * Heritage intro: the guest's name, the monogram inside a slowly breathing gold
 * ring, and the date. Tapping the monogram opens the invitation — the same
 * gesture starts the music (see InvitationShell).
 */
export function HeritageIntro({ phase, view, onOpen }: Props) {
  const { event, guest, t, heritage: h } = view;
  if (phase === "open" || !h) return null;
  const opening = phase === "opening";
  const s = h.second;
  const hintId = "heritage-intro-hint";
  const openLabel = s ? `${t.intro.open} · ${s.t.intro.open}` : t.intro.open;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-names"
      style={heritageStyle("light")}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto bg-inv-bg text-inv-text transition-opacity duration-1000 ease-[var(--ease-editorial)]",
        opening && "opacity-0 delay-300",
      )}
    >
      <div className="relative isolate mx-auto flex min-h-full w-full max-w-[30rem] flex-col items-center justify-center px-10 py-20 text-center">
        <Frame className="absolute inset-0 -z-10" />

        <h1 id="intro-names" className="sr-only">
          {coupleNames(event.partnerOne, event.partnerTwo, true)} — {event.label}
        </h1>

        <div {...rise(150)} className="animate-rise">
          <p className="text-[1.375rem] leading-tight text-her-red">
            {guest ? interpolate(t.intro.forGuest, { name: guest.name }) : event.label}
          </p>
          {s && (
            <p lang={s.locale} className="her-label mt-2">
              {guest ? interpolate(s.t.intro.forGuest, { name: guest.name }) : s.label}
            </p>
          )}
        </div>

        <div {...rise(350)} className="animate-rise mt-10">
          {/* Separate wrapper: the entrance animation's fill would otherwise override the opening scale. */}
          <div
            className={cn("relative transition-transform duration-1000 ease-[var(--ease-editorial)]", opening && "scale-110")}
            style={{ width: MONOGRAM, height: MONOGRAM * 1.25 }}
          >
            {/* Breathing ring, centred on the medallion and wide enough to hold the birds and pendant. */}
            <span
              className="her-breathe pointer-events-none absolute rounded-full border border-her-gold"
              style={{ width: 212, height: 212, left: MONOGRAM / 2 - 106, top: 150 - 106 }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute rounded-full border border-inv-line"
              style={{ width: 226, height: 226, left: MONOGRAM / 2 - 113, top: 150 - 113 }}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={onOpen}
              disabled={opening}
              aria-label={openLabel}
              aria-describedby={hintId}
              className="relative block rounded-full outline-offset-8 focus-visible:outline-2 focus-visible:outline-her-red"
            >
              <Monogram size={MONOGRAM} initials={h.initials} />
            </button>
          </div>
        </div>

        <p id={hintId} {...rise(600)} className="animate-rise mt-8 max-w-[17rem]">
          <span className="block text-[0.9375rem] leading-6">{t.heritage.tapToOpen}</span>
          <Tr text={s?.t.heritage.tapToOpen} lang={s?.locale} className="text-base leading-6" />
        </p>

        <p {...rise(800)} className="animate-rise mt-7">
          <time dateTime={event.dateISO} className="block text-[1.0625rem] leading-7">
            {h.fullDate}
          </time>
          <Tr text={s?.fullDate} lang={s?.locale} className="text-base leading-6" />
        </p>
      </div>
    </div>
  );
}
