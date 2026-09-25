import "server-only";
import { siteUrl } from "@/config/brand";
import { db } from "@/lib/db";
import { isLocale, parseLocaleList, resolveLocalized, type Locale } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { dayKey } from "@/lib/utils/dates";

export function eventLocales(event: { defaultLocale: string; enabledLocales: string }): Locale[] {
  const fallback: Locale = isLocale(event.defaultLocale) ? event.defaultLocale : "hy";
  return parseLocaleList(event.enabledLocales, fallback);
}

export function eventTitle(event: { partnerOneName: string; partnerTwoName: string; defaultLocale: string }): string {
  const locale: Locale = isLocale(event.defaultLocale) ? event.defaultLocale : "hy";
  return displayNames(resolveLocalized(event.partnerOneName, locale), resolveLocalized(event.partnerTwoName, locale)) || "Untitled";
}

export const invitationUrl = (eventSlug: string, guestSlug?: string) =>
  `${siteUrl()}/${eventSlug}${guestSlug ? `/${guestSlug}` : ""}`;

export async function getEventStats(eventId: string, timezone: string) {
  const [invited, opened, attending, declined, headcount, transport, dietary, daily] = await Promise.all([
    db.guest.count({ where: { eventId } }),
    db.guest.count({ where: { eventId, openedAt: { not: null } } }),
    db.rsvp.count({ where: { eventId, attendance: "ATTENDING" } }),
    db.rsvp.count({ where: { eventId, attendance: "DECLINED" } }),
    db.rsvp.aggregate({ where: { eventId, attendance: "ATTENDING" }, _sum: { guestCount: true } }),
    db.rsvp.count({ where: { eventId, attendance: "ATTENDING", transportationNeeded: true } }),
    db.rsvp.count({ where: { eventId, attendance: "ATTENDING", dietaryRestrictions: { not: null } } }),
    db.eventDailyStat.findMany({ where: { eventId }, orderBy: { day: "desc" }, take: 60 }),
  ]);

  // Last 21 days, zero-filled, oldest first.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days = Array.from({ length: 21 }, (_, i) => {
    const date = new Date(Date.now() - (20 - i) * 86_400_000);
    const key = dayKey(date, timezone);
    return { day: key, views: byDay.get(key)?.views ?? 0, rsvps: byDay.get(key)?.rsvps ?? 0 };
  });

  const responded = attending + declined;
  return {
    invited,
    opened,
    responded,
    attending,
    declined,
    awaiting: Math.max(0, invited - responded),
    headcount: headcount._sum.guestCount ?? 0,
    transport,
    dietary,
    days,
    totalViews: daily.reduce((sum, d) => sum + d.views, 0),
  };
}

export type EventStats = Awaited<ReturnType<typeof getEventStats>>;
