import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField, Toggle } from "@/components/forms/fields";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { siteUrl } from "@/config/brand";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/locales";
import { COMMON_TIMEZONES, utcToZonedInput } from "@/lib/utils/dates";
import { deleteEventAction, updateSettingsAction } from "@/server/actions/events";
import { eventLocales } from "@/server/queries/events";

export default async function SettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const s = await db.invitationSettings.findUnique({ where: { eventId: event.id } });
  const enabled = eventLocales(event);
  const timezones = COMMON_TIMEZONES.includes(event.timezone as (typeof COMMON_TIMEZONES)[number]) ? COMMON_TIMEZONES : [event.timezone, ...COMMON_TIMEZONES];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />

      <ActionForm action={updateSettingsAction.bind(null, event.id)} className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Address & visibility" description="Publishing is done from the project page once the customer approves." />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField name="slug" label="Invitation address" defaultValue={event.slug} required maxLength={60} hint={`${siteUrl()}/${event.slug} — changing it breaks links you have already sent.`} />
            <SelectField name="timezone" label="Timezone" defaultValue={event.timezone} options={timezones.map((tz) => ({ value: tz, label: tz }))} hint="Times on the invitation are shown in this timezone." />
          </div>
          <div className="mt-2 divide-y divide-stone-100">
            <Toggle
              name="indexable"
              label="Allow search engines to index this invitation"
              description="Off by default: invitations are personal. Personal guest links are never indexed."
              defaultChecked={event.indexable}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Languages" description="Guests see their personal language if set, otherwise the default." />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField name="defaultLocale" label="Default language" defaultValue={event.defaultLocale} options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l].native }))} />
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-stone-800">Enabled languages</legend>
              <div className="flex flex-wrap gap-4 pt-2">
                {LOCALES.map((l) => (
                  <label key={l} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name={`locale.${l}`} defaultChecked={enabled.includes(l)} className="h-4 w-4 accent-espresso" />
                    {LOCALE_LABELS[l].native}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <Toggle name="allowLocaleSwitch" label="Let guests switch language" description="Shows a small language selector on the invitation." defaultChecked={event.allowLocaleSwitch} />
        </Card>

        <Card>
          <CardHeader title="RSVP" />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              name="rsvpDeadline"
              label="Respond by (optional)"
              type="date"
              defaultValue={s?.rsvpDeadline ? utcToZonedInput(s.rsvpDeadline, event.timezone).date : ""}
              hint="Responses close at the end of this day."
            />
            <TextField
              name="defaultAllowedGuests"
              label="Party size for general-link responses"
              type="number"
              min={1}
              max={20}
              defaultValue={s?.defaultAllowedGuests ?? 2}
              hint="Personal links use each guest's own allowance."
            />
          </div>
          <div className="mt-2 divide-y divide-stone-100">
            <Toggle name="rsvpEnabled" label="Accept responses" defaultChecked={s?.rsvpEnabled ?? true} />
            <Toggle name="allowRsvpUpdates" label="Guests can change their response" defaultChecked={s?.allowRsvpUpdates ?? true} />
            <Toggle name="openRsvp" label="Allow responses from the general link" description="If off, only guests with a personal link can respond." defaultChecked={s?.openRsvp ?? true} />
            <Toggle name="askGuestCount" label="Ask how many guests are coming" description="Up to each guest's allowance." defaultChecked={s?.askGuestCount ?? true} />
            <Toggle name="askCompanions" label="Ask for companion names" defaultChecked={s?.askCompanions ?? true} />
            <Toggle name="askTransportation" label="Ask about transportation" defaultChecked={s?.askTransportation ?? true} />
            <Toggle name="askDietary" label="Ask about dietary restrictions" defaultChecked={s?.askDietary ?? true} />
            <Toggle name="askPhone" label="Ask for a phone number" defaultChecked={s?.askPhone ?? true} />
            <Toggle name="askMessage" label="Invite a message for the couple" defaultChecked={s?.askMessage ?? true} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Sections" description="Hide sections you don't need." />
          <div className="divide-y divide-stone-100">
            <Toggle name="showGallery" label="Photo story" defaultChecked={s?.showGallery ?? true} />
            <Toggle name="showCountdown" label="Countdown" defaultChecked={s?.showCountdown ?? true} />
            <Toggle name="showSchedule" label="Schedule" defaultChecked={s?.showSchedule ?? true} />
            <Toggle name="showLocations" label="Locations" defaultChecked={s?.showLocations ?? true} />
          </div>
        </Card>

        <div className="flex justify-end">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </ActionForm>

      <Card className="border-red-200">
        <CardHeader title="Delete invitation" description="Permanently deletes the invitation, all guests, responses and uploaded files. This cannot be undone." />
        <ActionForm action={deleteEventAction.bind(null, event.id)} className="flex flex-wrap items-end gap-3" confirm="Delete this invitation and all of its data permanently?">
          <TextField name="confirmSlug" label={`Type “${event.slug}” to confirm`} autoComplete="off" className="min-w-64 flex-1" />
          <SubmitButton variant="danger" pendingLabel="Deleting…">
            Delete permanently
          </SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
