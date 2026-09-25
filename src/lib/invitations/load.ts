import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getDictionary, isLocale, parseLocaleList, resolveLocalized, type Locale } from "@/lib/i18n";
import { getTheme, themeStyle } from "@/lib/themes";
import { formatDotDate, formatLongDate, formatTime, formatWeekday } from "@/lib/utils/dates";
import { mapsDirectionsUrl, mapsSearchUrl } from "@/lib/utils/maps";
import { asEnum, ATTENDANCE, EVENT_TYPES, LOCATION_KINDS } from "@/lib/validation/enums";
import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import type { InvitationView } from "@/types/invitation";
import { parseSwatches } from "./dress-code";
import { monogram } from "./monogram";

/**
 * guest          — the real invitation a guest opens (drafts only visible to staff)
 * staff-preview  — studio live preview next to the editor (intro skipped, nothing recorded)
 * review         — the customer's private preview (authorised by the review token)
 * example        — public template showcase built from the demo event
 */
export type RenderMode = "guest" | "staff-preview" | "review" | "example";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

/** Event lookup shared by metadata and page rendering (memoised per request). */
export const findPublicEvent = cache(async (slug: string, includeDrafts = false) => {
  if (!SLUG_RE.test(slug)) return null;
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      invitationSettings: true,
      designSettings: true,
      musicSettings: true,
      dressCode: true,
      scheduleItems: { orderBy: [{ position: "asc" }, { startTime: "asc" }], include: { location: true } },
      locations: { orderBy: { position: "asc" } },
      galleryImages: { orderBy: { position: "asc" }, take: 12 },
    },
  });
  if (!event || event.status === "ARCHIVED") return null;
  if (event.status === "DRAFT" && !includeDrafts) {
    // Drafts are visible to ORÉ staff only (customers see them via their review link).
    const user = await getCurrentUser();
    if (!user || !isStaffRole(user.role)) return null;
  }
  return event;
});

export const findGuest = cache(async (eventId: string, guestSlug: string) => {
  if (!SLUG_RE.test(guestSlug)) return null;
  return db.guest.findUnique({
    where: { eventId_slug: { eventId, slug: guestSlug } },
    include: { rsvp: true },
  });
});

export function chooseLocale(
  requested: string | undefined,
  guestLocale: string | null | undefined,
  defaultLocale: Locale,
  enabled: Locale[],
  allowSwitch: boolean,
): Locale {
  if (allowSwitch && isLocale(requested) && enabled.includes(requested)) return requested;
  if (isLocale(guestLocale) && enabled.includes(guestLocale)) return guestLocale;
  return defaultLocale;
}

type LoadOptions = {
  eventSlug: string;
  guestSlug?: string;
  lang?: string;
  mode?: RenderMode;
  /** Render with a different template (template showcase). */
  themeId?: string;
  /** Skip the intro screen (embedded studio preview). */
  startOpen?: boolean;
};

export async function loadInvitation({ eventSlug, guestSlug, lang, mode = "guest", themeId, startOpen = false }: LoadOptions): Promise<InvitationView | null> {
  // Callers of non-guest modes have already authorised access (staff session or review token).
  const event = await findPublicEvent(eventSlug, mode === "staff-preview" || mode === "review");
  if (!event) return null;

  const guest = guestSlug ? await findGuest(event.id, guestSlug) : null;
  if (guestSlug && !guest) return null;

  const defaultLocale: Locale = isLocale(event.defaultLocale) ? event.defaultLocale : "hy";
  const locales = parseLocaleList(event.enabledLocales, defaultLocale);
  const locale = chooseLocale(lang, guest?.locale, defaultLocale, locales, event.allowLocaleSwitch);
  const t = getDictionary(locale);
  const L = (raw: string | null | undefined) => resolveLocalized(raw, locale, defaultLocale);
  const tz = event.timezone;

  const settings = event.invitationSettings;
  const design = event.designSettings;
  const theme = getTheme(themeId ?? design?.themeId);
  const eventType = asEnum(EVENT_TYPES, event.eventType, "WEDDING");
  const live = mode === "guest" && event.status === "PUBLISHED";
  const banner =
    mode === "staff-preview" ? "Studio preview" : mode === "review" ? t.review.privatePreview : mode === "guest" && !live ? "Preview · not published yet" : null;
  const now = new Date();
  const deadline = settings?.rsvpDeadline ?? null;
  const rsvpOpen = !!settings?.rsvpEnabled && (!deadline || deadline > now) && event.eventDate > now;

  const partnerOne = L(event.partnerOneName);
  const partnerTwo = L(event.partnerTwoName);
  const rsvp = guest?.rsvp;

  return {
    locale,
    locales,
    allowLocaleSwitch: event.allowLocaleSwitch && locales.length > 1,
    t,
    isPreview: !live,
    banner,
    startOpen: startOpen && mode === "staff-preview",
    basePath: guest ? `/${event.slug}/${guest.slug}` : `/${event.slug}`,
    event: {
      slug: event.slug,
      eventType,
      label: t.meta.labels[eventType],
      inviteLine: t.intro.invites[eventType],
      partnerOne,
      partnerTwo,
      monogram: monogram(partnerOne, partnerTwo),
      dateISO: event.eventDate.toISOString(),
      dotDate: formatDotDate(event.eventDate, tz),
      longDate: formatLongDate(event.eventDate, tz, locale),
      weekday: formatWeekday(event.eventDate, tz, locale),
      time: formatTime(event.eventDate, tz),
      heroImage: event.heroImage,
      heroSubtitle: L(event.heroSubtitle),
      welcomeText: L(event.welcomeText),
      invitationText: L(event.invitationText),
      closingText: L(event.closingText),
      closingImage: event.closingImage,
    },
    theme: {
      id: theme.id,
      style: themeStyle(theme, { accentColor: design?.accentColor }),
      hero: theme.variants.hero,
      intro: theme.variants.intro,
      showMonogram: design?.showMonogram ?? true,
      heroOverlay: Math.min(80, Math.max(0, design?.heroOverlay ?? 35)),
    },
    guest: guest ? { name: guest.name, slug: guest.slug, allowedGuests: Math.max(1, guest.allowedGuests) } : null,
    rsvp: rsvp
      ? {
          respondentName: rsvp.respondentName,
          attendance: asEnum(ATTENDANCE, rsvp.attendance, "ATTENDING"),
          guestCount: rsvp.guestCount,
          companionNames: rsvp.companionNames ?? "",
          transportationNeeded: rsvp.transportationNeeded,
          dietaryRestrictions: rsvp.dietaryRestrictions ?? "",
          message: rsvp.message ?? "",
          phone: rsvp.phone ?? "",
          submittedLabel: formatLongDate(rsvp.updatedAt, tz, locale),
        }
      : null,
    settings: {
      rsvpEnabled: settings?.rsvpEnabled ?? true,
      rsvpOpen,
      deadlineLabel: deadline ? formatLongDate(deadline, tz, locale) : null,
      allowUpdates: settings?.allowRsvpUpdates ?? true,
      openRsvp: settings?.openRsvp ?? true,
      askTransportation: settings?.askTransportation ?? true,
      askDietary: settings?.askDietary ?? true,
      askPhone: settings?.askPhone ?? true,
      askMessage: settings?.askMessage ?? true,
      askGuestCount: settings?.askGuestCount ?? true,
      askCompanions: settings?.askCompanions ?? true,
      rsvpMode: live ? "live" : "preview",
      maxGuests: guest ? Math.max(1, guest.allowedGuests) : Math.max(1, settings?.defaultAllowedGuests ?? 2),
      showCountdown: settings?.showCountdown ?? true,
      showGallery: settings?.showGallery ?? true,
      showSchedule: settings?.showSchedule ?? true,
      showLocations: settings?.showLocations ?? true,
    },
    gallery: event.galleryImages.map((img) => ({
      id: img.id,
      src: img.src,
      width: img.width,
      height: img.height,
      placeholder: img.placeholder,
      alt: img.alt || `${partnerOne} & ${partnerTwo}`,
    })),
    schedule: event.scheduleItems.map((item) => ({
      id: item.id,
      time: item.startTime,
      title: L(item.title),
      description: L(item.description),
      icon: item.icon,
      locationName: item.location ? L(item.location.name) : null,
    })),
    locations: event.locations.map((loc) => {
      const name = L(loc.name);
      const target = { name, address: loc.address, latitude: loc.latitude, longitude: loc.longitude };
      return {
        id: loc.id,
        kind: asEnum(LOCATION_KINDS, loc.kind, "OTHER"),
        name,
        description: L(loc.description),
        address: loc.address,
        image: loc.image,
        mapsUrl: mapsSearchUrl(target),
        directionsUrl: mapsDirectionsUrl(target),
      };
    }),
    dressCode: event.dressCode?.enabled
      ? {
          title: L(event.dressCode.title),
          description: L(event.dressCode.description),
          swatches: parseSwatches(event.dressCode.swatches).map((s) => ({
            hex: s.hex,
            name: resolveLocalized(JSON.stringify(s.name), locale, defaultLocale),
          })),
          image: event.dressCode.image,
        }
      : null,
    music:
      event.musicSettings?.enabled && event.musicSettings.rightsConfirmed && event.musicSettings.trackUrl
        ? {
            src: event.musicSettings.trackUrl,
            title: event.musicSettings.title,
            artist: event.musicSettings.artist,
            volume: Math.min(100, Math.max(0, event.musicSettings.volume)) / 100,
          }
        : null,
  };
}
