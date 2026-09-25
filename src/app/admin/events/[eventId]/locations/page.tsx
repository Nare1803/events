import { ItemActions } from "@/components/admin/item-actions";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { LocalizedField, SelectField, TextField } from "@/components/forms/fields";
import { ImageField } from "@/components/forms/image-field";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getDictionary, parseLocalized, resolveLocalized, type Locale, type LocalizedText } from "@/lib/i18n";
import { mapsSearchUrl } from "@/lib/utils/maps";
import { LOCATION_KINDS } from "@/lib/validation/enums";
import { createLocationAction, deleteLocationAction, moveLocationAction, updateLocationAction } from "@/server/actions/program";
import { eventLocales } from "@/server/queries/events";

type Values = {
  kind?: string;
  name?: LocalizedText;
  description?: LocalizedText;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
};

const KIND_OPTIONS = LOCATION_KINDS.map((k) => ({ value: k, label: getDictionary("en").locations.kinds[k] }));

function LocationFields({ values, locales }: { values: Values; locales: Locale[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField name="kind" label="Type" defaultValue={values.kind ?? "CEREMONY"} options={KIND_OPTIONS} />
      <LocalizedField name="name" label="Venue name" value={values.name ?? {}} locales={locales} maxLength={120} />
      <LocalizedField name="description" label="Short description" value={values.description ?? {}} locales={locales} multiline rows={2} maxLength={500} />
      <TextField name="address" label="Address" defaultValue={values.address} required maxLength={300} hint="Used for “Open in Maps” and directions." />
      <TextField name="latitude" label="Latitude (optional)" defaultValue={values.latitude ?? ""} placeholder="40.1573" hint="Add coordinates for an exact pin." />
      <TextField name="longitude" label="Longitude (optional)" defaultValue={values.longitude ?? ""} placeholder="44.2862" />
      <div className="md:col-span-2">
        <ImageField name="image" label="Venue photo (optional)" current={values.image ?? null} />
      </div>
    </div>
  );
}

export default async function LocationsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const locations = await db.location.findMany({ where: { eventId: event.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const locales = eventLocales(event);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Locations" description="Church, ceremony, reception, after-party — each with map links for guests." />

      {locations.length === 0 && <EmptyState title="No locations yet" description="Add your first venue below." />}

      <div className="flex flex-col gap-3">
        {locations.map((location, index) => {
          const name = resolveLocalized(location.name, locales[0]);
          return (
            <Card key={location.id} className="p-0 sm:p-0">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="block font-medium">{name}</span>
                    <span className="text-sm text-stone-500">{location.address}</span>
                  </span>
                  <span className="text-xs text-stone-500">Edit ▾</span>
                </summary>
                <div className="border-t border-stone-100 px-5 py-5">
                  <ActionForm action={updateLocationAction.bind(null, event.id, location.id)}>
                    <LocationFields
                      values={{ ...location, name: parseLocalized(location.name), description: parseLocalized(location.description) }}
                      locales={locales}
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <ItemActions
                          label={name}
                          move={moveLocationAction.bind(null, event.id, location.id)}
                          remove={deleteLocationAction.bind(null, event.id, location.id)}
                          confirmText={`Delete “${name}”? Schedule items using it will keep their time but lose the location.`}
                          isFirst={index === 0}
                          isLast={index === locations.length - 1}
                        />
                        <a href={mapsSearchUrl({ ...location, name })} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">
                          Test map link
                        </a>
                      </div>
                      <SubmitButton>Save</SubmitButton>
                    </div>
                  </ActionForm>
                </div>
              </details>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Add a location" />
        <ActionForm key={locations.length} action={createLocationAction.bind(null, event.id)}>
          <LocationFields values={{}} locales={locales} />
          <div className="mt-4 flex justify-end">
            <SubmitButton pendingLabel="Adding…">Add location</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
