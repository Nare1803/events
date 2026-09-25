import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { TextField, Toggle } from "@/components/forms/fields";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatPrice, parseFeatures } from "@/lib/templates/catalogue";
import { savePackageAction } from "@/server/actions/catalogue";

type PackageRow = Awaited<ReturnType<typeof db.servicePackage.findMany>>[number];

function PackageFields({ pkg }: { pkg?: PackageRow }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={pkg?.name} required maxLength={60} />
        <TextField name="tagline" label="Tagline" defaultValue={pkg?.tagline} maxLength={120} />
        <TextField name="description" label="Description" defaultValue={pkg?.description} multiline rows={2} maxLength={1000} className="md:col-span-2" />
        <TextField
          name="features"
          label="Features (one per line)"
          defaultValue={pkg ? parseFeatures(pkg.features).join("\n") : ""}
          multiline
          rows={4}
          className="md:col-span-2"
        />
        <TextField name="includedRevisions" label="Included revision rounds" type="number" min={0} max={50} defaultValue={pkg?.includedRevisions ?? ""} hint="Leave empty for unlimited." />
        <div className="grid grid-cols-[1fr_90px] gap-2">
          <TextField name="priceAmount" label="Price" type="number" min={0} defaultValue={pkg?.priceAmount ?? ""} hint="Leave empty to hide the price." />
          <TextField name="currency" label="Currency" defaultValue={pkg?.currency ?? "AMD"} maxLength={3} />
        </div>
        <TextField name="sortOrder" label="Order" type="number" min={0} max={999} defaultValue={pkg?.sortOrder ?? 0} />
      </div>
      <div className="mt-2 divide-y divide-stone-100">
        <Toggle name="active" label="Offered to customers" defaultChecked={pkg?.active ?? true} />
        <Toggle name="isDefault" label="Pre-selected on the order form" defaultChecked={pkg?.isDefault ?? false} />
      </div>
    </>
  );
}

export default async function PackagesPage() {
  await requireStaff();
  const packages = await db.servicePackage.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader title="Packages" description="Service packages shown on the website and order form. Prices are optional — leave them empty until they're final." />
      <div className="flex flex-col gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-0 sm:p-0">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="font-medium">{pkg.name}</span>
                  <span className="ml-2 text-sm text-stone-500">{pkg.tagline}</span>
                </span>
                <span className="flex items-center gap-2">
                  {pkg.isDefault && <Badge tone="info">Default</Badge>}
                  <Badge tone={pkg.active ? "success" : "neutral"}>{pkg.active ? "Active" : "Hidden"}</Badge>
                  <span className="text-sm text-stone-600">{formatPrice(pkg.priceAmount, pkg.currency) ?? "Price not shown"}</span>
                </span>
              </summary>
              <div className="border-t border-stone-100 px-5 py-5">
                <ActionForm action={savePackageAction.bind(null, pkg.id)}>
                  <PackageFields pkg={pkg} />
                  <div className="mt-4 flex justify-end">
                    <SubmitButton>Save package</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
        <Card>
          <CardHeader title="Add a package" />
          <ActionForm key={packages.length} action={savePackageAction.bind(null, null)}>
            <PackageFields />
            <div className="mt-4 flex justify-end">
              <SubmitButton>Create package</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </main>
  );
}
