"use client";

import { interpolate } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { OLD_MONEY, oldMoneyStyle } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import type { InvitationView } from "@/types/invitation";
import type { IntroPhase } from "../intro-screen";
import { EngravedBorder, LabelRule, WaxSeal } from "./ornaments";

type Props = {
  phase: IntroPhase;
  view: Pick<InvitationView, "event" | "guest" | "t" | "oldMoney">;
  onOpen: () => void;
};

const rise = (delay: number) => ({ style: { animationDelay: `${delay}ms` } });

/**
 * A sealed envelope on night. Tapping the seal opens the invitation and starts
 * the music (InvitationShell). Motion, all under 1.3s: the seal presses
 * (150ms), the flap opens (600ms), the card rises (700ms), then the night
 * fades. With reduced motion the shell skips straight to the hero.
 */
export function OldMoneyIntro({ phase, view, onOpen }: Props) {
  const { event, guest, t, oldMoney: om } = view;
  if (phase === "open" || !om) return null;
  const opening = phase === "opening";
  const hintId = "om-intro-hint";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-names"
      data-state={opening ? "open" : "closed"}
      style={oldMoneyStyle("dark")}
      className="om-intro fixed inset-0 z-50 overflow-y-auto bg-inv-bg text-inv-text"
    >
      <div className="relative isolate mx-auto flex min-h-full w-full max-w-[30rem] flex-col items-center justify-center px-10 pb-16 pt-24 text-center">
        <EngravedBorder tone="dark" className="absolute inset-0 -z-10" />

        <h1 id="intro-names" className="sr-only">
          {displayNames(event.partnerOne, event.partnerTwo)} — {event.label}
        </h1>
        <p {...rise(150)} className="animate-rise om-for">
          {guest ? interpolate(t.intro.forGuest, { name: guest.name }) : event.label}
        </p>
        <p {...rise(300)} className="animate-rise om-date mt-3 text-om-label">
          <time dateTime={event.dateISO}>{om.fullDate}</time>
        </p>

        <div {...rise(450)} className="animate-rise mt-10 w-full max-w-[20rem]">
          <div className="om-envelope relative aspect-[3/2] w-full">
            <div className="om-env-back absolute inset-0" style={{ backgroundColor: OLD_MONEY.paper }} />
            {/* The card inside; it rises once the flap is open. */}
            <div className="om-env-card absolute inset-x-[7%] bottom-[7%] top-[5%] flex items-start justify-center pt-[9%]" style={{ backgroundColor: OLD_MONEY.cotton }}>
              <span className="absolute inset-[6px] border border-om-gold/60" aria-hidden="true" />
              <LabelRule />
            </div>
            <svg viewBox="0 0 300 200" className="om-env-pocket absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
              <path d="M0 0 L150 112 L0 200 Z M300 0 L150 112 L300 200 Z M0 200 L150 112 L300 200 Z" fill={OLD_MONEY.paper} />
              <rect x={7} y={7} width={286} height={186} fill="none" stroke={OLD_MONEY.gold} strokeWidth={0.6} opacity={0.7} />
              <path d="M0 200 L150 112 L300 200" fill="none" stroke="#D3CBBB" strokeWidth={1} />
            </svg>
            <div className="om-env-flap absolute inset-x-0 top-0 h-[56%]">
              <svg viewBox="0 0 300 112" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true" focusable="false">
                <path d="M0 0 L300 0 L150 112 Z" fill={OLD_MONEY.linen} stroke={OLD_MONEY.gold} strokeWidth={1} />
              </svg>
            </div>
            <span className="om-env-ring pointer-events-none absolute left-1/2 top-[56%] h-[6.5rem] w-[6.5rem] rounded-full border border-om-label" aria-hidden="true" />
            <button
              type="button"
              onClick={onOpen}
              disabled={opening}
              aria-label={t.intro.open}
              aria-describedby={hintId}
              className="om-env-seal absolute left-1/2 top-[56%] block rounded-full"
            >
              <WaxSeal initials={om.initials} size={88} />
            </button>
          </div>
        </div>

        <p id={hintId} {...rise(650)} className={cn("animate-rise om-label mt-10 text-inv-muted")}>
          {t.oldMoney.tapSeal}
        </p>
      </div>
    </div>
  );
}
