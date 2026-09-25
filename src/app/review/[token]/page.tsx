import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvitationPage } from "@/components/invitation/invitation-page";
import { CouplePortal } from "@/components/review/couple-portal";
import { ReviewPanel } from "@/components/review/review-panel";
import { brand } from "@/config/brand";
import { getDictionary, interpolate, isLocale, resolveLocalized, type Locale } from "@/lib/i18n";
import { loadInvitation } from "@/lib/invitations/load";
import { displayNames } from "@/lib/invitations/monogram";
import { findProjectByToken, revisionsRemaining } from "@/lib/projects/review";
import { formatLongDate } from "@/lib/utils/dates";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string | string[] }> };

export const metadata: Metadata = {
  title: `${brand.name} — Private preview`,
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

/**
 * The customer's private link. Before the preview is shared it explains that the
 * invitation is being prepared; during review it shows the invitation with
 * approve / request-changes; once published it becomes the couple's portal.
 */
export default async function ReviewPage({ params, searchParams }: Props) {
  const [{ token }, { lang }] = await Promise.all([params, searchParams]);
  const project = await findProjectByToken(token);
  if (!project) notFound();

  const locale: Locale = isLocale(project.customer.locale) ? project.customer.locale : isLocale(project.event.defaultLocale) ? project.event.defaultLocale : "hy";
  const dict = getDictionary(locale);
  const t = dict.review;
  const title =
    displayNames(resolveLocalized(project.event.partnerOneName, locale), resolveLocalized(project.event.partnerTwoName, locale)) || project.customer.name;

  if (project.status === "PUBLISHED") {
    return <CouplePortal token={token} event={project.event} title={title} t={t} locale={locale} />;
  }

  if (project.status === "READY_FOR_REVIEW" || project.status === "CHANGES_REQUESTED" || project.status === "APPROVED") {
    const view = await loadInvitation({ eventSlug: project.event.slug, mode: "review", lang: typeof lang === "string" ? lang : locale });
    if (!view) notFound();
    return (
      <InvitationPage
        view={view}
        after={
          <ReviewPanel
            token={token}
            status={project.status}
            revisionsLeft={revisionsRemaining(project.package?.includedRevisions, project.revisionCount)}
            revisions={project.revisions.map((r) => ({
              id: r.id,
              message: r.message,
              open: r.status === "OPEN",
              date: formatLongDate(r.createdAt, project.event.timezone, locale),
            }))}
            t={t}
            errors={dict.rsvp.errors}
          />
        }
      />
    );
  }

  const closed = project.status === "ARCHIVED";
  return (
    <main lang={locale} className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 py-20 text-center text-espresso">
      <Link href="/" className="font-serif text-3xl tracking-[0.24em]">
        {brand.name}
      </Link>
      <p className="mt-16 text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-[#6F5D53]">{interpolate(t.preparedFor, { names: title })}</p>
      <h1 className="mt-6 max-w-xl font-serif text-5xl font-light leading-tight">{closed ? t.closedTitle : t.preparingTitle}</h1>
      <p className="mt-6 max-w-md leading-8 text-[#665449]">{closed ? t.closedText : t.preparingText}</p>
      <span className="mt-12 block h-12 w-px bg-espresso/30" aria-hidden="true" />
      <p className="mt-12 max-w-md text-sm text-[#665449]">{interpolate(t.help, { email: brand.supportEmail })}</p>
    </main>
  );
}
