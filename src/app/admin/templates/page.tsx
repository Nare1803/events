import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField, Toggle } from "@/components/forms/fields";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/auth/session";
import { listTemplates } from "@/lib/templates/catalogue";
import { saveTemplateAction } from "@/server/actions/catalogue";

export default async function TemplatesPage() {
  await requireStaff();
  const templates = await listTemplates({ publicOnly: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Templates"
        description="A template controls presentation; each event's data controls the content. Naming, order and visibility are set here — the design itself lives in the code registry, so new templates are added by the product team once and then reused for every couple."
      />
      <div className="flex flex-col gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-200" aria-hidden="true">
                <span className="flex-1" style={{ background: t.tokens.colors.background }} />
                <span className="flex-1" style={{ background: t.tokens.colors.accent }} />
                <span className="flex-1" style={{ background: t.tokens.colors.inverseBackground }} />
              </span>
              <span className="font-medium">{t.name}</span>
              <code className="text-xs text-stone-500">{t.key}</code>
              {t.implemented ? <Badge tone="success">Ready</Badge> : <Badge tone="warning">Coming soon — not implemented</Badge>}
              {t.implemented && (
                <Link href={`/designs/${t.key}`} target="_blank" className="ml-auto text-sm underline underline-offset-4">
                  Live example
                </Link>
              )}
            </div>
            <ActionForm action={saveTemplateAction.bind(null, t.id)} className="grid gap-4 md:grid-cols-[1fr_1fr_100px]">
              <TextField name="name" label="Name" defaultValue={t.name} required maxLength={60} />
              <TextField name="description" label="Description" defaultValue={t.description} maxLength={300} />
              <TextField name="sortOrder" label="Order" type="number" min={0} max={999} defaultValue={t.sortOrder} />
              <div className="md:col-span-2">
                <Toggle
                  name="isPublic"
                  label="Show on the website"
                  description={t.implemented ? "Customers can choose it." : "Shown as “coming soon” — customers cannot choose it."}
                  defaultChecked={t.isPublic}
                />
              </div>
              <div className="flex items-end justify-end">
                <SubmitButton variant="secondary">Save</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        ))}
      </div>
    </main>
  );
}
