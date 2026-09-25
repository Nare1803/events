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
