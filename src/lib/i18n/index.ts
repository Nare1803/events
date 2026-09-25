import { en, type Dictionary } from "./dictionaries/en";
import { hy } from "./dictionaries/hy";
import { ru } from "./dictionaries/ru";
import type { Locale } from "./locales";

const dictionaries: Record<Locale, Dictionary> = { en, hy, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };
export * from "./locales";
export * from "./localized";
export { interpolate } from "./format";
