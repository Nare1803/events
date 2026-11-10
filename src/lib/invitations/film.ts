import "server-only";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatByDate, formatFullDate, formatZoneName } from "@/lib/utils/dates";
import type { FilmView } from "@/types/invitation";
import type { findPublicEvent } from "./load";
import { initialsOf } from "./monogram";

type EventRecord = NonNullable<Awaited<ReturnType<typeof findPublicEvent>>>;

/** Dates, initials and the time-zone line the Romantic Film template prints, in the guest's language. */
export function buildFilmView(
  event: EventRecord,
  { partnerOne, partnerTwo, locale, t }: { partnerOne: string; partnerTwo: string; locale: Locale; t: Dictionary },
): FilmView {
  const tz = event.timezone;
  const deadline = event.invitationSettings?.rsvpDeadline ?? null;
  return {
    initials: initialsOf(partnerOne, partnerTwo),
    fullDate: formatFullDate(event.eventDate, tz, locale),
    deadline: deadline ? formatByDate(deadline, tz, locale) : null,
    // Most ORÉ weddings are in Armenia: "Yerevan time" reads better than Intl's "Armenia Standard Time".
    zone: tz === "Asia/Yerevan" ? t.film.yerevanTime : formatZoneName(event.eventDate, tz, locale),
  };
}
