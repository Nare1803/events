import Link from "next/link";
import { ctaPrimary, ctaSecondary, SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { TemplatePreview } from "@/components/site/template-preview";
import { site } from "@/content/site";
import { formatPrice, listActivePackages, listTemplates } from "@/lib/templates/catalogue";
import { cn } from "@/lib/utils/cn";

// Catalogue edits in the studio revalidate this page immediately; this is a safety net.
export const revalidate = 300;

const eyebrow = "text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-[#6F5D53]";

export default async function HomePage() {
  const [templates, packages] = await Promise.all([listTemplates({ publicOnly: true }), listActivePackages()]);
  const featured = templates.slice(0, 3);
  const editorial = templates.find((t) => t.key === "editorial-nude") ?? templates[0];

  return (
    <div className="min-h-dvh bg-ivory text-espresso">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-8 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <p className={eyebrow}>{site.hero.eyebrow}</p>
            <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,5.5rem)] font-light leading-[0.95]">{site.hero.title}</h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#665449]">{site.hero.text}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/create" className={ctaPrimary}>
                {site.hero.primary}
              </Link>
              <Link href="/designs" className={ctaSecondary}>
                {site.hero.secondary}
              </Link>
            </div>
          </div>

          {editorial && (
            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="rounded-[2.6rem] border border-espresso/20 bg-espresso p-2.5 shadow-[0_40px_80px_-40px_rgba(41,36,33,0.6)]">
                <div className="overflow-hidden rounded-[2rem] text-[15px]">
                  <TemplatePreview tokens={editorial.tokens} heroVariant={editorial.heroVariant} />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-6 w-48 border border-espresso/15 bg-ivory px-5 py-6 text-center shadow-[0_24px_48px_-24px_rgba(41,36,33,0.45)] sm:-left-16">
                <p className="text-[0.55rem] font-medium uppercase tracking-[0.3em] text-[#6F5D53]">For Naz</p>
                <p className="mt-3 font-serif text-2xl font-light leading-none">Anna &amp; David</p>
                <p className="mt-3 font-serif text-sm italic text-[#665449]">invite you to celebrate their wedding</p>
                <p className="mt-4 text-[0.5rem] font-medium uppercase tracking-[0.3em]">Open invitation</p>
              </div>
            </div>
          )}
        </section>

        {/* Statement */}
        <section className="bg-espresso px-6 py-24 text-center text-ivory sm:py-32">
          <h2 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light italic">{site.statement.title}</h2>
          <p className="mx-auto mt-8 max-w-xl leading-8 text-ivory/75">{site.statement.text}</p>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-24 sm:py-32">
          <p className={cn(eyebrow, "text-center")}>{site.how.eyebrow}</p>
          <h2 className="mt-5 text-center font-serif text-5xl font-light">{site.how.title}</h2>
          <ol className="mt-16 grid gap-12 md:grid-cols-4 md:gap-8">
            {site.how.steps.map((step) => (
              <li key={step.n} className="border-t border-espresso/20 pt-6">
                <span className="font-serif text-4xl font-light text-[#6F5D53]">{step.n}</span>
                <h3 className="mt-4 font-serif text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#665449]">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16 text-center">
            <Link href="/create" className={ctaPrimary}>
              {site.hero.primary}
            </Link>
          </div>
        </section>

        {/* Designs */}
        <section className="bg-nude/60 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <p className={cn(eyebrow, "text-center")}>{site.designs.eyebrow}</p>
            <h2 className="mt-5 text-center font-serif text-5xl font-light">{site.designs.title}</h2>
            <p className="mx-auto mt-6 max-w-lg text-center leading-8 text-[#665449]">{site.designs.text}</p>
            <div className="mt-16 grid gap-10 sm:grid-cols-3">
              {featured.map((t) => (
                <Link key={t.key} href={t.available ? `/designs/${t.key}` : "/designs"} className="group block">
                  <div className="overflow-hidden border border-espresso/10 text-[13px] transition-transform duration-700 group-hover:-translate-y-1">
                    <TemplatePreview tokens={t.tokens} heroVariant={t.heroVariant} muted={!t.available} />
                  </div>
                  <p className="mt-5 font-serif text-2xl">{t.name}</p>
                  <p className="mt-1 text-sm text-[#665449]">{t.available ? site.designs.view : site.designs.soon}</p>
                </Link>
              ))}
            </div>
            <div className="mt-14 text-center">
              <Link href="/designs" className={ctaSecondary}>
                {site.designs.all}
              </Link>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className={cn(eyebrow, "text-center")}>{site.experience.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-2xl text-center font-serif text-5xl font-light">{site.experience.title}</h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-2">
            {site.experience.items.map((item) => (
              <div key={item.title} className="border-l border-espresso/20 pl-6">
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 leading-7 text-[#665449]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        {packages.length > 0 && (
          <section id="packages" className="scroll-mt-8 border-t border-espresso/10 px-6 py-24 sm:py-32">
            <div className="mx-auto max-w-6xl">
              <p className={cn(eyebrow, "text-center")}>{site.packages.eyebrow}</p>
              <h2 className="mx-auto mt-5 max-w-2xl text-center font-serif text-5xl font-light">{site.packages.title}</h2>
              <div className={cn("mt-16 grid gap-6", packages.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
                {packages.map((p) => (
                  <div key={p.id} className={cn("flex flex-col border p-8", p.isDefault ? "border-espresso bg-white/50" : "border-espresso/15")}>
                    {p.isDefault && <p className="mb-4 text-[0.625rem] font-medium uppercase tracking-[0.28em] text-[#6F5D53]">{site.packages.popular}</p>}
                    <h3 className="font-serif text-3xl">{p.name}</h3>
                    <p className="mt-2 font-serif text-lg italic text-[#665449]">{p.tagline}</p>
                    <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-3">
                          <span className="mt-2 h-px w-4 shrink-0 bg-espresso/40" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-8 font-serif text-2xl">{formatPrice(p.priceAmount, p.currency) ?? site.packages.onRequest}</p>
                    <Link href={`/create?package=${p.key}`} className={cn(p.isDefault ? ctaPrimary : ctaSecondary, "mt-6")}>
                      {site.packages.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Closing */}
        <section className="bg-espresso px-6 py-24 text-center text-ivory sm:py-32">
          <h2 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light">{site.closing.title}</h2>
          <p className="mt-6 text-ivory/75">{site.closing.text}</p>
          <Link
            href="/create"
            className="mt-10 inline-flex min-h-12 items-center border border-ivory px-8 text-[0.6875rem] font-medium uppercase tracking-[0.28em] transition-colors hover:bg-ivory hover:text-espresso"
          >
            {site.closing.cta}
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
