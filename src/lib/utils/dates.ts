import { LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Converts a wall-clock date/time in `timeZone` to a UTC instant (DST-safe). */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle offsets that change around the target time.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess), timeZone);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += asUtc - shown;
  }
  return new Date(guess);
}

/** Splits a UTC instant into "YYYY-MM-DD" and "HH:mm" for the given timezone. */
export function utcToZonedInput(date: Date, timeZone: string): { date: string; time: string } {
  const p = zonedParts(date, timeZone);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Calendar day key, e.g. "2027-07-18", in the given timezone. */
export function dayKey(date: Date, timeZone: string): string {
  return utcToZonedInput(date, timeZone).date;
}

/** Whole calendar days from today to `date` in `timeZone`: "today", "tomorrow", "in 249 days", "3 days ago". */
export function formatDaysAway(date: Date, timeZone: string, now: Date = new Date()): string {
  const days = Math.round((Date.parse(dayKey(date, timeZone)) - Date.parse(dayKey(now, timeZone))) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/** Editorial date, e.g. "18 · 07 · 2027". */
export function formatDotDate(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.day)} · ${pad(p.month)} · ${p.year}`;
}

export function formatLongDate(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_LABELS[locale].intl, {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekday(date: Date, timeZone: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_LABELS[locale].intl, { timeZone, weekday: "long" }).format(date);
}

export function formatTime(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Day, month and year as numbers in the given timezone. */
export function zonedDay(date: Date, timeZone: string): { day: number; month: number; year: number } {
  const p = zonedParts(date, timeZone);
  return { day: p.day, month: p.month, year: p.year };
}

function namedParts(date: Date, timeZone: string, locale: Locale, options: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat(LOCALE_LABELS[locale].intl, { timeZone, ...options }).formatToParts(date);
  return (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
}

const capitalise = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/**
 * Letter-style date with weekday, the same shape in every language:
 * "Կիրակի, 18 հուլիսի 2027" · "Sunday, 18 July 2027" · "Воскресенье, 18 июля 2027".
 * (Intl's own Armenian and Russian forms add "թ." / "г." and drop the capital.)
 */
export function formatFullDate(date: Date, timeZone: string, locale: Locale): string {
  const get = namedParts(date, timeZone, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${capitalise(get("weekday"))}, ${get("day")} ${get("month")} ${get("year")}`;
}

/**
 * A date-only ISO string from a date input ("2027-07-18") in words:
 * "Sunday, 18 July 2027". Null when it is empty or not a real day.
 */
export function formatIsoDay(iso: string, locale: Locale = "en"): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Noon UTC keeps the day the same whatever the zone used for formatting.
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return formatFullDate(date, "UTC", locale);
}

/** Day, month and year without Intl's "թ." / "г." suffixes: "15 հունիսի 2027" · "15 June 2027" · "15 июня 2027". */
export function formatPlainDate(date: Date, timeZone: string, locale: Locale): string {
  const get = namedParts(date, timeZone, locale, { day: "numeric", month: "long", year: "numeric" });
  return `${get("day")} ${get("month")} ${get("year")}`;
}

/** Short reply-by date: "հունիսի 15-ը" · "15 June" · "15 июня". */
export function formatDayMonth(date: Date, timeZone: string, locale: Locale): string {
  const get = namedParts(date, timeZone, locale, { day: "numeric", month: "long" });
  return locale === "hy" ? `${get("month")} ${get("day")}-ը` : `${get("day")} ${get("month")}`;
}

/**
 * A full date as it reads after "by": "2027 թ. հունիսի 15-ը" · "15 June 2027" · "15 июня 2027".
 * Armenian puts the year first and the day last, with the article.
 */
export function formatByDate(date: Date, timeZone: string, locale: Locale): string {
  if (locale !== "hy") return formatPlainDate(date, timeZone, locale);
  const get = namedParts(date, timeZone, locale, { day: "numeric", month: "long", year: "numeric" });
  return `${get("year")} թ. ${get("month")} ${get("day")}-ը`;
}

/** The zone's name in the reader's language, e.g. "Armenia Standard Time" (Intl's long generic name). */
export function formatZoneName(date: Date, timeZone: string, locale: Locale): string {
  return namedParts(date, timeZone, locale, { timeZoneName: "longGeneric" })("timeZoneName");
}

/** Clock time as people say it: "3 pm" / "3:30 pm" in English, "15:00" otherwise. */
export function formatClock(date: Date, timeZone: string, locale: Locale): string {
  if (locale !== "en") return formatTime(date, timeZone);
  const p = zonedParts(date, timeZone);
  const hour = p.hour % 12 || 12;
  const suffix = p.hour < 12 ? "am" : "pm";
  return p.minute ? `${hour}:${pad(p.minute)} ${suffix}` : `${hour} ${suffix}`;
}

/** Compact date-time for the dashboard, e.g. "18 Jul 2027, 15:00". */
export function formatDateTime(date: Date | null | undefined, timeZone = "Asia/Yerevan"): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const COMMON_TIMEZONES = [
  "Asia/Yerevan",
  "Europe/Moscow",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;
