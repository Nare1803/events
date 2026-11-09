import "server-only";
import type { Locale } from "@/lib/i18n";
import { formatFullDate, formatPlainDate, zonedDay } from "@/lib/utils/dates";
import { romanDate } from "@/lib/utils/roman-numerals";
import type { OldMoneyView } from "@/types/invitation";
import type { findPublicEvent } from "./load";
import { initialsOf } from "./monogram";

type EventRecord = NonNullable<Awaited<ReturnType<typeof findPublicEvent>>>;

/** Dates and initials the Old Money template prints, in the guest's language. */
export function buildOldMoneyView(
  event: EventRecord,
  { partnerOne, partnerTwo, locale, rsvpOpen, now }: { partnerOne: string; partnerTwo: string; locale: Locale; rsvpOpen: boolean; now: Date },
): OldMoneyView {
  const tz = event.timezone;
  const { day, month, year } = zonedDay(event.eventDate, tz);
  const deadline = event.invitationSettings?.rsvpDeadline ?? null;
  const rsvpEnabled = event.invitationSettings?.rsvpEnabled ?? true;
  // Replies close at the deadline, or on the day itself when there is none.
  const closedAt = rsvpEnabled && !rsvpOpen ? (deadline && deadline <= now ? deadline : event.eventDate) : null;

  return {
    initials: initialsOf(partnerOne, partnerTwo),
    romanDate: romanDate(day, month, year),
    fullDate: formatFullDate(event.eventDate, tz, locale),
    deadline: deadline ? formatPlainDate(deadline, tz, locale) : null,
    closedOn: closedAt ? formatPlainDate(closedAt, tz, locale) : null,
  };
}
