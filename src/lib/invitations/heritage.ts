import "server-only";
import { getDictionary, parseLocalized, type Locale } from "@/lib/i18n";
import { armenianNumeralDate } from "@/lib/utils/armenian-numerals";
import { formatClock, formatDayMonth, formatFullDate, formatLongDate, zonedDay } from "@/lib/utils/dates";
import type { HeritageView } from "@/types/invitation";
import { parseSwatches } from "./dress-code";
import type { findPublicEvent } from "./load";

type EventRecord = NonNullable<Awaited<ReturnType<typeof findPublicEvent>>>;

/**
 * Armenian is always the first language. The second line follows the guest:
 * their chosen language if it isn't Armenian, otherwise the first other
 * language the couple enabled, otherwise none (Armenian only).
 */
export function heritageSecondLocale(reader: Locale, enabled: Locale[]): Locale | null {
  if (reader !== "hy") return reader;
  return enabled.find((l) => l !== "hy") ?? null;
}

const initial = (name: string) => Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "";

export function buildHeritageView(
  event: EventRecord,
  {
    partnerOne,
    partnerTwo,
    second,
    rsvpUpdatedAt,
  }: { partnerOne: string; partnerTwo: string; second: Locale | null; rsvpUpdatedAt: Date | null },
): HeritageView {
  const tz = event.timezone;
  const { day, month, year } = zonedDay(event.eventDate, tz);
  const deadline = event.invitationSettings?.rsvpDeadline ?? null;

  return {
    numeralDate: armenianNumeralDate(day, month, year),
    initials: [partnerOne, partnerTwo].map(initial).filter(Boolean),
    fullDate: formatFullDate(event.eventDate, tz, "hy"),
    deadline: deadline ? formatDayMonth(deadline, tz, "hy") : null,
    second: second ? buildSecond(event, second, rsvpUpdatedAt) : null,
  };
}

function buildSecond(event: EventRecord, locale: Locale, rsvpUpdatedAt: Date | null): NonNullable<HeritageView["second"]> {
  const tz = event.timezone;
  const t = getDictionary(locale);
  const S = (raw: string | null | undefined) => parseLocalized(raw)[locale] ?? "";
  const deadline = event.invitationSettings?.rsvpDeadline ?? null;
  const dress = event.dressCode?.enabled ? event.dressCode : null;

  return {
    locale,
    t,
    label: t.meta.labels[event.eventType as keyof typeof t.meta.labels] ?? t.meta.labels.OTHER,
    partnerOne: S(event.partnerOneName),
    partnerTwo: S(event.partnerTwoName),
    fullDate: formatFullDate(event.eventDate, tz, locale),
    time: formatClock(event.eventDate, tz, locale),
    deadline: deadline ? formatDayMonth(deadline, tz, locale) : null,
    respondedOn: rsvpUpdatedAt ? formatLongDate(rsvpUpdatedAt, tz, locale) : null,
    heroSubtitle: S(event.heroSubtitle),
    welcomeText: S(event.welcomeText),
    invitationText: S(event.invitationText),
    closingText: S(event.closingText),
    schedule: Object.fromEntries(
      event.scheduleItems.map((item) => [
        item.id,
        { title: S(item.title), description: S(item.description), locationName: item.location ? S(item.location.name) : "" },
      ]),
    ),
    locations: Object.fromEntries(event.locations.map((loc) => [loc.id, { name: S(loc.name), description: S(loc.description) }])),
    dressCode: dress
      ? {
          title: S(dress.title),
          description: S(dress.description),
          swatches: parseSwatches(dress.swatches).map((s) => s.name[locale] ?? ""),
        }
      : null,
  };
}
