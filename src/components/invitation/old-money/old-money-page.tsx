import type { ReactNode } from "react";
import { interpolate } from "@/lib/i18n";
import { oldMoneyStyle } from "@/lib/themes";
import type { InvitationView, OldMoneyView } from "@/types/invitation";
import { Reveal } from "../reveal";
import { OldMoneyCountdown } from "./countdown";
import { Screen, SectionHeader } from "./primitives";
import { OldMoneyRsvp } from "./rsvp";
import {
  OldMoneyClosing,
  OldMoneyDressCode,
  OldMoneyGallery,
  OldMoneyHero,
  OldMoneySchedule,
  OldMoneyVenues,
  OldMoneyWelcome,
} from "./sections";

type View = InvitationView & { oldMoney: OldMoneyView };

/**
 * Old Money: framed "screens" on paper, phone first. On desktop the hero is two
 * columns, the order of the day sits on a linen band and everything else is a
 * centred ≈640px column. `after` renders below (review panel, template CTA).
 */
export function OldMoneyPage({ view, after }: { view: InvitationView; after?: ReactNode }) {
  if (!view.oldMoney) return null;
  const v = view as View;
  const { settings, t, event, oldMoney: om } = v;

  return (
    <div className="om-root bg-inv-bg text-inv-text" style={oldMoneyStyle("light")}>
      <OldMoneyHero view={v} />
      <OldMoneyWelcome view={v} />
      {settings.showCountdown && <OldMoneyCountdown dateISO={event.dateISO} t={t.countdown} dateLine={`${om.fullDate} · ${event.time}`} />}
      {settings.showSchedule && <OldMoneySchedule view={v} />}
      {settings.showLocations && <OldMoneyVenues view={v} />}
      <OldMoneyDressCode view={v} />
      {settings.showGallery && <OldMoneyGallery view={v} />}
      {settings.rsvpEnabled && (
        // The reply card: cotton on phones, a cotton column on desktop.
        <Screen id="rsvp" labelledBy="rsvp-heading" band="bg-om-cotton lg:bg-inv-bg" box="bg-om-cotton">
          <SectionHeader id="rsvp-heading" label={t.rsvp.eyebrow} title={t.rsvp.title} />
          {om.deadline && settings.rsvpOpen && <p className="om-reply-by mt-6 text-center">{interpolate(t.oldMoney.replyBy, { date: om.deadline })}</p>}
          <Reveal delay={100} className="mx-auto mt-8 max-w-[28rem]">
            <OldMoneyRsvp
              eventSlug={event.slug}
              locale={v.locale}
              guest={v.guest}
              existing={v.rsvp}
              settings={settings}
              t={t.rsvp}
              om={t.oldMoney}
              sendLabel={t.heritage.send}
              closedOn={om.closedOn}
              stepLabels={{ fewer: t.heritage.fewerGuests, more: t.heritage.moreGuests }}
            />
          </Reveal>
        </Screen>
      )}
      <OldMoneyClosing view={v} />
      {after}
    </div>
  );
}
