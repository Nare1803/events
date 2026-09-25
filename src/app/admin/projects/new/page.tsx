import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField } from "@/components/forms/fields";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/auth/session";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/locales";
import { listActivePackages, listTemplates } from "@/lib/templates/catalogue";
import { COMMON_TIMEZONES } from "@/lib/utils/dates";
import { CONTACT_LABELS, CONTACT_METHODS } from "@/lib/validation/project";
import { createProjectAction } from "@/server/actions/projects";

const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "BAPTISM", label: "Baptism" },
  { value: "OTHER", label: "Other celebration" },
];

export default async function NewProjectPage() {
  await requireStaff();
  const [templates, packages] = await Promise.all([listTemplates({ publicOnly: false }), listActivePackages()]);
  const defaultPackage = packages.find((p) => p.isDefault) ?? packages[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin" className="text-sm text-stone-500 hover:text-espresso">
        ← Projects
      </Link>
      <PageHeader
        title="New project"
        description="For customers who reached ORÉ directly. Requests from the website order form are created automatically."
      />
      <ActionForm action={createProjectAction} className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Customer" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="customerName" label="Name" required maxLength={120} className="sm:col-span-2" />
            <TextField name="customerPhone" label="Phone / WhatsApp" type="tel" />
            <TextField name="customerEmail" label="Email" type="email" />
            <SelectField name="preferredContact" label="Preferred contact" defaultValue="WHATSAPP" options={CONTACT_METHODS.map((m) => ({ value: m, label: CONTACT_LABELS[m] }))} />
            <SelectField
              name="customerLocale"
              label="Invitation language"
              defaultValue="hy"
              options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l].native }))}
              hint="Also used for the customer's review page."
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Celebration" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="eventType" label="Type" defaultValue="WEDDING" options={EVENT_TYPES} className="sm:col-span-2" />
            <TextField name="partnerOne" label="First name" required maxLength={60} />
            <TextField name="partnerTwo" label="Second name" maxLength={60} hint="Leave empty for single-host events." />
            <TextField name="date" label="Date" type="date" required />
            <TextField name="time" label="Start time" type="time" defaultValue="16:00" required />
            <SelectField name="timezone" label="Timezone" defaultValue="Asia/Yerevan" options={COMMON_TIMEZONES.map((tz) => ({ value: tz, label: tz }))} />
            <SelectField
              name="templateKey"
              label="Template"
              defaultValue={templates.find((t) => t.implemented)?.key}
              options={templates.filter((t) => t.implemented).map((t) => ({ value: t.key, label: t.name }))}
            />
            <SelectField
              name="packageId"
              label="Package"
              defaultValue={defaultPackage?.id ?? ""}
              options={[{ value: "", label: "Not decided" }, ...packages.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
        </div>
      </ActionForm>
    </main>
  );
}
