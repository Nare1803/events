"use client";

import { displayNames } from "@/lib/invitations/monogram";
import { filmStyle } from "@/lib/themes";
import type { InvitationView } from "@/types/invitation";
import type { IntroPhase } from "../intro-screen";
import { LeaderRing, PlayIcon, SprocketEdges } from "./ornaments";
import { Atmosphere, ForGuest } from "./primitives";

type Props = {
  phase: IntroPhase;
  view: Pick<InvitationView, "event" | "guest" | "t" | "film">;
  onOpen: () => void;
};

/**
 * The lights go down: a film leader on darkness between sprocket edges. The
 * leader counts 3 · 2 · 1 and the initials settle in by 1.45s (the rest frame
 * at once with reduced motion). "Tap to begin" opens the invitation and starts
 * the music; the leader then fades in 300ms while the hero's letterbox bars
 * close in (InvitationShell).
 */
export function FilmIntro({ phase, view, onOpen }: Props) {
  const { event, guest, t, film } = view;
  if (phase === "open" || !film) return null;
  const opening = phase === "opening";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-names"
      data-state={opening ? "open" : "closed"}
      style={filmStyle()}
      className="rf-intro rf-dark fixed inset-0 z-50 isolate overflow-y-auto bg-rf-night text-rf-fg"
    >
      <Atmosphere leaks={["tl-amber"]} />
      <SprocketEdges />
      <div className="relative mx-auto flex min-h-full w-full max-w-[30rem] flex-col items-center px-11 pb-[6.5rem] pt-[8.5rem] text-center">
        <h1 id="intro-names" className="sr-only">
          {displayNames(event.partnerOne, event.partnerTwo)} — {event.label}
        </h1>
        {guest ? <ForGuest className="rf-for" template={t.intro.forGuest} name={guest.name} /> : <p className="rf-for">{event.label}</p>}
        <LeaderRing count initials={film.initials} className="mt-9" />
        <p className="rf-title-date mt-9">
          <time dateTime={event.dateISO}>{film.fullDate}</time>
        </p>
        <div className="mt-auto pt-14">
          <button type="button" onClick={onOpen} disabled={opening} className="rf-begin">
            <PlayIcon className="text-rf-amber" />
            {t.film.tapToBegin}
          </button>
        </div>
      </div>
    </div>
  );
}
