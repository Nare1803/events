import type { ReactNode } from "react";
import { interpolate } from "@/lib/i18n";
import { heritageStyle } from "@/lib/themes";
import type { HeritageView, InvitationView } from "@/types/invitation";
import { Reveal } from "../reveal";
import { HeritageCountdown } from "./countdown";
import { SectionHeading } from "./ornaments";
import { Page } from "./primitives";
import { HeritageRsvp } from "./rsvp";
import {
  HeritageClosing,
  HeritageDressCode,
  HeritageGallery,
  HeritageHero,
  HeritageSchedule,
  HeritageVenues,
  HeritageWelcome,
} from "./sections";

type View = InvitationView & { heritage: HeritageView };

/**
 * Armenian Heritage: a single centred column of framed manuscript pages
 * (≈ phone width on every screen). Section order follows the approved design.
 * `after` renders below the column (review panel, template call-to-action).
 */
export function HeritagePage({ view, after }: { view: InvitationView; after?: ReactNode }) {
  if (!view.heritage) return null;
  const v = view as View;
  const { settings, t, event } = v;
  const h = v.heritage;
  const s = h.second;

  return (
    <div style={heritageStyle("light")}>
      <div className="mx-auto w-full max-w-[30rem] bg-inv-bg sm:shadow-[0_40px_90px_-50px_rgba(28,23,20,0.55)]">
        <HeritageHero view={v} />
        <HeritageWelcome view={v} />
        {settings.showCountdown && (
          <HeritageCountdown
            dateISO={event.dateISO}
            t={t.countdown}
            second={s ? { locale: s.locale, t: s.t.countdown } : null}
            dateLine={`${h.fullDate} · ${event.time}`}
            dateLine2={s ? `${s.fullDate} · ${s.time}` : null}
          />
        )}
        {settings.showSchedule && <HeritageSchedule view={v} />}
        {settings.showLocations && <HeritageVenues view={v} />}
        <HeritageDressCode view={v} />
        {settings.showGallery && <HeritageGallery view={v} />}
        {settings.rsvpEnabled && (
          <Page id="rsvp" labelledBy="rsvp-heading">
            <Reveal>
              <SectionHeading id="rsvp-heading" hy={t.rsvp.title} translation={s?.t.rsvp.title} lang={s?.locale} />
              {h.deadline && (
                <p className="mt-4 text-[0.9375rem] leading-6 text-inv-muted">
                  {interpolate(t.rsvp.deadline, { date: h.deadline })}
                  {s?.deadline && (
                    <span lang={s.locale} className="her-tr block">
                      {interpolate(s.t.rsvp.deadline, { date: s.deadline })}
                    </span>
                  )}
                </p>
              )}
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <HeritageRsvp
                eventSlug={event.slug}
                locale={v.locale}
                guest={v.guest}
                existing={v.rsvp}
                settings={settings}
                t={t.rsvp}
                h={t.heritage}
                second={s ? { locale: s.locale, t: s.t.rsvp, h: s.t.heritage, respondedOn: s.respondedOn } : null}
              />
            </Reveal>
          </Page>
        )}
        <HeritageClosing view={v} />
      </div>
      {after}
    </div>
  );
}
