import "server-only";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { getDictionary, interpolate, isLocale, resolveLocalized, type Locale } from "@/lib/i18n";
import { formatLongDate } from "@/lib/utils/dates";
import { asEnum, EVENT_TYPES } from "@/lib/validation/enums";
import { findPublicEvent } from "./load";
import { displayNames } from "./monogram";

/**
 * Social preview + robots metadata for an invitation. Guest names are never
 * included, so link previews cached by messengers don't leak personal data.
 */
export async function invitationMetadata(eventSlug: string): Promise<Metadata> {
  const event = await findPublicEvent(eventSlug);
  if (!event) return { title: brand.name, robots: { index: false, follow: false } };

  const locale: Locale = isLocale(event.defaultLocale) ? event.defaultLocale : "hy";
  const t = getDictionary(locale);
  const names = displayNames(resolveLocalized(event.partnerOneName, locale), resolveLocalized(event.partnerTwoName, locale));
  const label = t.meta.labels[asEnum(EVENT_TYPES, event.eventType, "WEDDING")];
  const date = formatLongDate(event.eventDate, event.timezone, locale);
  const title = interpolate(t.meta.invitationTitle, { names, label });
  const description =
    resolveLocalized(event.socialDescription, locale) || interpolate(t.meta.invitationDescription, { names, date, label });
  const image = event.socialImage || `/api/og/${event.slug}?v=${event.updatedAt.getTime()}`;
  const indexable = event.indexable && event.status === "PUBLISHED";

  return {
    title: { absolute: title },
    description,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    alternates: { canonical: `/${event.slug}` },
    openGraph: {
      title: `${names} · ${date}`,
      description,
      type: "website",
      url: `/${event.slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title: `${names} · ${date}`, description, images: [image] },
  };
}
