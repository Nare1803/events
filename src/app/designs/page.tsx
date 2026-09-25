import type { Metadata } from "next";
import Link from "next/link";
import { ctaPrimary, SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { TemplatePreview } from "@/components/site/template-preview";
import { site } from "@/content/site";
import { listTemplates } from "@/lib/templates/catalogue";

export const metadata: Metadata = { title: "Designs", description: site.designs.text };
export const revalidate = 300;

export default async function DesignsPage() {
  const templates = await listTemplates({ publicOnly: true });
  return (
    <div className="min-h-dvh bg-ivory text-espresso">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <p className="text-center text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-[#6F5D53]">{site.designs.eyebrow}</p>
        <h1 className="mt-5 text-center font-serif text-6xl font-light">{site.designs.title}</h1>
        <p className="mx-auto mt-6 max-w-lg text-center leading-8 text-[#665449]">{site.designs.text}</p>

        <ul className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.key}>
              <div className="relative overflow-hidden border border-espresso/10 text-[15px]">
                <TemplatePreview tokens={t.tokens} heroVariant={t.heroVariant} muted={!t.available} />
                {!t.available && (
                  <span className="absolute left-4 top-4 bg-ivory px-3 py-1.5 text-[0.575rem] font-medium uppercase tracking-[0.28em]">
                    {site.designs.soon}
                  </span>
                )}
              </div>
              <h2 className="mt-6 font-serif text-3xl">{t.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[#665449]">{t.description}</p>
              {t.available ? (
                <div className="mt-5 flex flex-wrap items-center gap-6">
                  <Link href={`/create?template=${t.key}`} className={ctaPrimary}>
                    {site.designs.choose}
                  </Link>
                  <Link href={`/designs/${t.key}`} className="inv-link">
                    {site.designs.view}
                  </Link>
                </div>
              ) : (
                <p className="mt-5 text-[0.6875rem] font-medium uppercase tracking-[0.24em] text-[#6F5D53]">{site.designs.soon}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
