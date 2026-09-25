import type { Metadata } from "next";
import { IntakeClient } from "@/components/intake/intake-client";
import { intakeCopy } from "@/content/site";
import { formatPrice, listActivePackages, listTemplates } from "@/lib/templates/catalogue";

export const metadata: Metadata = { title: intakeCopy.title, description: intakeCopy.intro };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ template?: string | string[]; package?: string | string[] }> };

export default async function CreatePage({ searchParams }: Props) {
  const [params, templates, packages] = await Promise.all([searchParams, listTemplates({ publicOnly: true }), listActivePackages()]);
  return (
    <IntakeClient
      templates={templates.map((t) => ({ key: t.key, name: t.name, description: t.description, available: t.available, tokens: t.tokens, heroVariant: t.heroVariant }))}
      packages={packages.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, features: p.features, price: formatPrice(p.priceAmount, p.currency), isDefault: p.isDefault }))}
      wantedTemplate={typeof params.template === "string" ? params.template : undefined}
      wantedPackage={typeof params.package === "string" ? params.package : undefined}
    />
  );
}
