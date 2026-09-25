import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/invitation/invitation-page";
import { brand } from "@/config/brand";
import { site } from "@/content/site";
import { db } from "@/lib/db";
import { loadInvitation } from "@/lib/invitations/load";
import { isSelectableTheme } from "@/lib/themes";

type Props = { params: Promise<{ templateKey: string }>; searchParams: Promise<{ lang?: string | string[] }> };

async function findTemplate(key: string) {
  if (!/^[a-z0-9-]{1,40}$/.test(key) || !isSelectableTheme(key)) return null;
  return db.template.findFirst({ where: { key, isPublic: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await findTemplate((await params).templateKey);
  return template
    ? { title: `${template.name} — live example`, description: template.description, robots: { index: true, follow: true } }
    : { title: brand.name };
}

/** Public live example: the showcase wedding rendered in the chosen template. RSVP is not saved. */
export default async function DesignExamplePage({ params, searchParams }: Props) {
  const [{ templateKey }, { lang }] = await Promise.all([params, searchParams]);
  const template = await findTemplate(templateKey);
  if (!template) notFound();
  const view = await loadInvitation({
    eventSlug: brand.demoEventSlug,
    mode: "example",
    themeId: template.key,
    lang: typeof lang === "string" ? lang : undefined,
  });
  if (!view) notFound();

  return (
    <InvitationPage
      view={view}
      after={
        <section className="bg-inv-bg px-6 py-20 text-center text-inv-text sm:py-28">
          <p className="inv-eyebrow text-inv-accent">{site.designs.eyebrow}</p>
          <h2 className="inv-display mt-6 text-5xl">{template.name}</h2>
          <p className="mx-auto mt-6 max-w-md leading-8 text-inv-muted">{template.description}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/create?template=${template.key}`} className="inv-button inv-button-solid">
              {site.designs.choose}
            </Link>
            <Link href="/designs" className="inv-link">
              {site.designs.all}
            </Link>
          </div>
        </section>
      }
    />
  );
}
