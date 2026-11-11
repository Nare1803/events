export const LOCALES = ["hy", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

/** `tag`: the guest-facing switcher label, each language in its own script (Հայ · Eng · Рус). */
export const LOCALE_LABELS: Record<Locale, { native: string; short: string; tag: string; intl: string }> = {
  hy: { native: "Հայերեն", short: "ՀԱՅ", tag: "Հայ", intl: "hy-AM" },
  en: { native: "English", short: "EN", tag: "Eng", intl: "en-GB" },
  ru: { native: "Русский", short: "РУС", tag: "Рус", intl: "ru-RU" },
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
