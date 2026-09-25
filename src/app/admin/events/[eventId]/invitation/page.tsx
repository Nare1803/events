import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { LocalizedField, SelectField, TextField, Toggle } from "@/components/forms/fields";
import { ColorField } from "@/components/forms/color-field";
import { ImageField } from "@/components/forms/image-field";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseLocalized } from "@/lib/i18n/localized";
import { parseSwatches } from "@/lib/invitations/dress-code";
import { utcToZonedInput } from "@/lib/utils/dates";
import { updateDressCodeAction, updateInvitationAction } from "@/server/actions/events";
import { eventLocales } from "@/server/queries/events";

export default async function InvitationEditorPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const dressCode = await db.dressCode.findUnique({ where: { eventId: event.id } });
  const locales = eventLocales(event);
  const { date, time } = utcToZonedInput(event.eventDate, event.timezone);
  const swatches = parseSwatches(dressCode?.swatches);
  const slots = Array.from({ length: 6 }, (_, i) => swatches[i] ?? null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Content"
        description={
          locales.length > 1
            ? "Write each text in every enabled language using the language tabs. Empty translations fall back to the default language."
            : "The words and images your guests will see. Add languages in Settings."
        }
      />

      <ActionForm action={updateInvitationAction.bind(null, event.id)} className="flex flex-col gap-6">
        <Card>
          <CardHeader title="The celebration" />
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              name="eventType"
              label="Type"
              defaultValue={event.eventType}
              className="md:col-span-2"
              options={[
                { value: "WEDDING", label: "Wedding" },
                { value: "ENGAGEMENT", label: "Engagement" },
                { value: "BIRTHDAY", label: "Birthday" },
                { value: "BAPTISM", label: "Baptism" },
                { value: "OTHER", label: "Other celebration" },
              ]}
            />
            <LocalizedField name="partnerOneName" label="First name" value={parseLocalized(event.partnerOneName)} locales={locales} maxLength={60} />
            <LocalizedField name="partnerTwoName" label="Second name" value={parseLocalized(event.partnerTwoName)} locales={locales} maxLength={60} hint="Leave empty for single-host celebrations." />
            <TextField name="date" label="Date" type="date" defaultValue={date} required />
            <TextField name="time" label="Start time" type="time" defaultValue={time} required hint={`Timezone: ${event.timezone} (change in Settings)`} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Words" description="Line breaks you type are kept in the invitation." />
          <div className="flex flex-col gap-5">
            <LocalizedField name="heroSubtitle" label="Hero subtitle" value={parseLocalized(event.heroSubtitle)} locales={locales} maxLength={200} hint="A short line under your names, e.g. “We found forever.”" />
            <LocalizedField name="welcomeText" label="Welcome message" value={parseLocalized(event.welcomeText)} locales={locales} multiline maxLength={600} />
            <LocalizedField name="invitationText" label="Invitation text" value={parseLocalized(event.invitationText)} locales={locales} multiline rows={4} maxLength={1200} />
            <LocalizedField name="closingText" label="Closing message" value={parseLocalized(event.closingText)} locales={locales} multiline rows={2} maxLength={300} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Images" description="Photos are optimized automatically for fast loading on phones." />
          <div className="grid gap-6 lg:grid-cols-2">
            <ImageField name="heroImage" label="Hero image" current={event.heroImage} aspect="3 / 4" />
            <ImageField name="closingImage" label="Closing section image" current={event.closingImage} aspect="3 / 2" />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Social preview"
            description="What appears when your link is shared on WhatsApp, Messenger or Telegram. Without an image, an elegant card with your names and date is generated. Guest names are never included."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <ImageField name="socialImage" label="Preview image (1200×630 recommended)" current={event.socialImage} aspect="1200 / 630" />
            <LocalizedField name="socialDescription" label="Preview description" value={parseLocalized(event.socialDescription)} locales={locales} maxLength={200} />
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <SubmitButton className="shadow-lg">Save invitation</SubmitButton>
        </div>
      </ActionForm>

      <ActionForm action={updateDressCodeAction.bind(null, event.id)}>
        <Card>
          <CardHeader title="Dress code" description="Optional. Up to six palette colours with names." />
          <Toggle name="enabled" label="Show dress code section" defaultChecked={dressCode?.enabled ?? false} />
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <LocalizedField name="title" label="Title" value={parseLocalized(dressCode?.title)} locales={locales} maxLength={80} hint="e.g. Elegant Evening" />
            <LocalizedField name="description" label="Explanation" value={parseLocalized(dressCode?.description)} locales={locales} multiline maxLength={600} />
          </div>
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-medium text-stone-800">Palette</legend>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {slots.map((swatch, i) => (
                <div key={i} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-3">
                    <ColorField name={`swatch${i}.hex`} label={`Colour ${i + 1}`} defaultValue={swatch?.hex} />
                  </div>
                  <LocalizedField name={`swatch${i}.name`} label="Name" value={swatch?.name ?? {}} locales={locales} maxLength={40} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">Leave the colour empty to hide a slot.</p>
          </fieldset>
          <div className="mt-6">
            <ImageField name="dressImage" label="Inspiration image" current={dressCode?.image ?? null} aspect="4 / 5" />
          </div>
          <div className="mt-6 flex justify-end">
            <SubmitButton>Save dress code</SubmitButton>
          </div>
        </Card>
      </ActionForm>
    </div>
  );
}
