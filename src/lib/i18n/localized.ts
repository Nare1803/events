import { LOCALES, type Locale } from "./locales";

/** Couple-authored content stored per language, e.g. {"hy": "...", "en": "..."}. */
export type LocalizedText = Partial<Record<Locale, string>>;

export function parseLocalized(raw: string | null | undefined): LocalizedText {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result: LocalizedText = {};
    for (const locale of LOCALES) {
      const text = (value as Record<string, unknown>)[locale];
      if (typeof text === "string" && text.trim()) result[locale] = text;
    }
    return result;
  } catch {
    return {};
  }
}

export function serializeLocalized(value: LocalizedText): string {
  const clean: LocalizedText = {};
  for (const locale of LOCALES) {
    const text = value[locale]?.trim();
    if (text) clean[locale] = text;
  }
  return JSON.stringify(clean);
}

/**
 * Picks the best available translation: requested locale → event default →
 * any non-empty value. Never returns undefined so templates stay simple.
 */
export function pickLocalized(value: LocalizedText, locale: Locale, fallback?: Locale): string {
  return value[locale] || (fallback && value[fallback]) || Object.values(value).find(Boolean) || "";
}

export function resolveLocalized(raw: string | null | undefined, locale: Locale, fallback?: Locale): string {
  return pickLocalized(parseLocalized(raw), locale, fallback);
}
