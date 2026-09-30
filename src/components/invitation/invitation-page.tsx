import type { ReactNode } from "react";
import type { InvitationView } from "@/types/invitation";
import { Countdown } from "./countdown";
import { DressCode } from "./dress-code";
import { Final } from "./final";
import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { InvitationShell } from "./invitation-shell";
import { Locations } from "./locations";
import { RsvpForm } from "./rsvp-form";
import { Schedule } from "./schedule";
import { Section } from "./section";
import { Welcome } from "./welcome";

/**
 * Composes the guest experience from reusable sections; the template styles them.
 * `after` renders below the closing section (review panel, template call-to-action).
 */
export function InvitationPage({ view, after }: { view: InvitationView; after?: ReactNode }) {
  const { settings, t } = view;
  const garden = view.theme.sections === "garden";
  return (
    <InvitationShell view={view}>
      <Hero view={view} />
      <Welcome view={view} />
      {settings.showGallery && <Gallery view={view} />}
      {settings.showCountdown && <Countdown dateISO={view.event.dateISO} t={t.countdown} garden={garden} />}
      {settings.showSchedule && <Schedule view={view} />}
      {settings.showLocations && <Locations view={view} />}
      <DressCode view={view} />
      {settings.rsvpEnabled && (
        <Section id="rsvp" eyebrow={t.rsvp.eyebrow} title={t.rsvp.title}>
          <div className={garden ? "mx-auto max-w-2xl rounded-[var(--inv-card-radius)] bg-inv-surface px-5 py-10 sm:px-12 sm:py-14" : undefined}>
            <RsvpForm
              eventSlug={view.event.slug}
              locale={view.locale}
              guest={view.guest}
              existing={view.rsvp}
              settings={settings}
              t={t.rsvp}
            />
          </div>
        </Section>
      )}
      <Final view={view} />
      {after}
    </InvitationShell>
  );
}
