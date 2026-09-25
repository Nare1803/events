export const LOCALES = ["hy", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, { native: string; short: string; intl: string }> = {
  hy: { native: "Հայերեն", short: "ՀԱՅ", intl: "hy-AM" },
  en: { native: "English", short: "EN", intl: "en-GB" },
  ru: { native: "Русский", short: "РУС", intl: "ru-RU" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Parses the comma separated `enabledLocales` column, always returning at least the default. */
export function parseLocaleList(value: string | null | undefined, fallback: Locale): Locale[] {
  const list = (value ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(isLocale);
  const unique = Array.from(new Set(list));
  if (!unique.includes(fallback)) unique.unshift(fallback);
  return unique;
}
