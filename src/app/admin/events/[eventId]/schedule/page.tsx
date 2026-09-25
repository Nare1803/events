import { ItemActions } from "@/components/admin/item-actions";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { LocalizedField, SelectField, TextField } from "@/components/forms/fields";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { parseLocalized, resolveLocalized, type Locale, type LocalizedText } from "@/lib/i18n";
import { SCHEDULE_ICONS } from "@/lib/validation/enums";
import {
  createScheduleItemAction,
  deleteScheduleItemAction,
  moveScheduleItemAction,
  updateScheduleItemAction,
} from "@/server/actions/program";
import { eventLocales } from "@/server/queries/events";

type Values = { startTime?: string; icon?: string | null; locationId?: string | null; title?: LocalizedText; description?: LocalizedText };

function ScheduleFields({ values, locales, locationOptions }: { values: Values; locales: Locale[]; locationOptions: { value: string; label: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-[140px_1fr]">
      <TextField name="startTime" label="Time" type="time" defaultValue={values.startTime ?? ""} required />
      <LocalizedField name="title" label="Title" value={values.title ?? {}} locales={locales} maxLength={120} />
      <SelectField
        name="icon"
        label="Icon"
        defaultValue={values.icon ?? ""}
        options={[{ value: "", label: "None" }, ...SCHEDULE_ICONS.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) }))]}
      />
      <LocalizedField name="description" label="Description" value={values.description ?? {}} locales={locales} maxLength={400} />
      <div className="md:col-start-2">
        <SelectField name="locationId" label="Location" defaultValue={values.locationId ?? ""} options={locationOptions} />
      </div>
    </div>
  );
}

export default async function SchedulePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const [items, locations] = await Promise.all([
    db.scheduleItem.findMany({ where: { eventId: event.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    db.location.findMany({ where: { eventId: event.id }, orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  const locales = eventLocales(event);
  const L = (raw: string) => resolveLocalized(raw, locales[0]);
  const locationOptions = [{ value: "", label: "No location" }, ...locations.map((l) => ({ value: l.id, label: L(l.name) }))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Schedule" description="The order of the day, shown as an elegant timeline. Times are local to the event." />

      {items.length === 0 && <EmptyState title="No schedule yet" description="Add the ceremony, dinner and celebration below." />}

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <Card key={item.id} className="p-0 sm:p-0">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-stone-500">{item.startTime}</span>
                  <span className="font-medium">{L(item.title)}</span>
                </span>
                <span className="text-xs text-stone-500">Edit ▾</span>
              </summary>
              <div className="border-t border-stone-100 px-5 py-5">
                <ActionForm action={updateScheduleItemAction.bind(null, event.id, item.id)}>
                  <ScheduleFields
                    values={{ ...item, title: parseLocalized(item.title), description: parseLocalized(item.description) }}
                    locales={locales}
                    locationOptions={locationOptions}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <ItemActions
                      label={L(item.title)}
                      move={moveScheduleItemAction.bind(null, event.id, item.id)}
                      remove={deleteScheduleItemAction.bind(null, event.id, item.id)}
                      confirmText={`Delete “${L(item.title)}”?`}
                      isFirst={index === 0}
                      isLast={index === items.length - 1}
                    />
                    <SubmitButton>Save</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Add to schedule" />
        <ActionForm key={items.length} action={createScheduleItemAction.bind(null, event.id)}>
          <ScheduleFields values={{}} locales={locales} locationOptions={locationOptions} />
          <div className="mt-4 flex justify-end">
            <SubmitButton pendingLabel="Adding…">Add item</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
