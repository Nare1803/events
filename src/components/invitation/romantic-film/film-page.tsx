import type { ReactNode } from "react";
import { displayNames } from "@/lib/invitations/monogram";
import { filmStyle } from "@/lib/themes";
import type { FilmView, InvitationView } from "@/types/invitation";
import { FilmCountdown } from "./countdown";
import { LabelRule } from "./ornaments";
import { Screen } from "./primitives";
import { FilmRsvp } from "./rsvp";
import { FilmClosing, FilmDressCode, FilmGallery, FilmHero, FilmSchedule, FilmVenues, FilmWelcome } from "./sections";

type View = InvitationView & { film: FilmView };
type Key = "countdown" | "schedule" | "venues" | "dressCode" | "gallery" | "rsvp";

/**
 * Romantic Film: the invitation plays like a reel. The leader (01) and the
 * title card (02) open it in darkness; the light comes up on photo paper for
 * the countdown, call sheet, venues, dress code and contact sheet; the RSVP
 * ticket and the end credits return to darkness. Screens are numbered in
 * order, so a hidden section never leaves a gap in the frame numbers.
 * `after` renders below (review panel, template CTA).
 */
export function FilmPage({ view, after }: { view: InvitationView; after?: ReactNode }) {
  if (!view.film) return null;
  const v = view as View;
  const { settings, t, event, film } = v;

  // Which paper screens are shown, in order; each gets the next frame number.
  const shown: Record<Key, boolean> = {
    countdown: settings.showCountdown,
    schedule: settings.showSchedule && v.schedule.length > 0,
    venues: settings.showLocations && v.locations.length > 0,
    dressCode: !!v.dressCode,
    gallery: settings.showGallery && v.gallery.length > 0,
    rsvp: settings.rsvpEnabled,
  };
  const order: Key[] = ["countdown", "schedule", "venues", "dressCode", "gallery", "rsvp"];
  const n = {} as Record<Key, number>;
  const seam = {} as Record<Key, boolean>;
  let frame = 3; // 01 leader · 02 title card · 03 welcome
  let previousLight = false;
  for (const key of order) {
    if (!shown[key]) continue;
    n[key] = ++frame;
    const light = key !== "rsvp";
    // A thin strip of film between two paper screens.
    seam[key] = light && previousLight;
    previousLight = light;
  }
  const closing = frame + 1;

  return (
    <div className="rf-root bg-rf-paper text-rf-ink" style={filmStyle()}>
      <FilmHero view={v} n={2} />
      <FilmWelcome view={v} n={3} />
      {shown.countdown && (
        <FilmCountdown
          dateISO={event.dateISO}
          t={t.countdown}
          label={t.film.countdown}
          date={film.fullDate}
          timeLine={`${event.time} · ${film.zone}`}
          n={n.countdown}
          seam={seam.countdown}
        />
      )}
      {shown.schedule && <FilmSchedule view={v} n={n.schedule} seam={seam.schedule} />}
      {shown.venues && <FilmVenues view={v} n={n.venues} seam={seam.venues} />}
      {shown.dressCode && <FilmDressCode view={v} n={n.dressCode} seam={seam.dressCode} />}
      {shown.gallery && <FilmGallery view={v} n={n.gallery} seam={seam.gallery} />}
      {shown.rsvp && (
        <Screen id="rsvp" labelledBy="rsvp-heading" tone="dark" n={n.rsvp} leaks={["tr-amber", "br-rose"]}>
          <LabelRule n={n.rsvp} label={t.rsvp.eyebrow} as="h2" id="rsvp-heading" />
          <div className="-mx-2 mt-7 lg:mx-auto lg:mt-12 lg:w-full lg:max-w-[28rem]">
            <FilmRsvp
              eventSlug={event.slug}
              locale={v.locale}
              guest={v.guest}
              existing={v.rsvp}
              settings={settings}
              t={t.rsvp}
              film={t.film}
              closedTitle={t.oldMoney.closedTitle}
              deadline={film.deadline}
              names={displayNames(event.partnerOne, event.partnerTwo)}
              stepLabels={{ fewer: t.heritage.fewerGuests, more: t.heritage.moreGuests }}
              fullName={t.heritage.fullName}
            />
          </div>
        </Screen>
      )}
      <FilmClosing view={v} n={closing} />
      {after}
    </div>
  );
}
