import { brand } from "@/config/brand";
import { HERITAGE } from "./heritage-palette";
import { FILM } from "./film-palette";
import { OLD_MONEY } from "./old-money-palette";
import type { Theme, ThemeOverrides, ThemeStyle } from "./types";

const SERIF = "var(--font-display), var(--font-display-hy), 'Times New Roman', serif";
const SANS = "var(--font-body), var(--font-body-hy), system-ui, sans-serif";

const editorialNude: Theme = {
  id: "editorial-nude",
  name: "Editorial Nude",
  description: "Warm ivory, soft nude and espresso. Magazine typography with generous whitespace.",
  available: true,
  tokens: {
    colors: {
      background: brand.colors.ivory,
      surface: brand.colors.nude,
      text: brand.colors.espresso,
      // Deepened mocha tones keep small text ≥ 4.5:1 on both ivory and nude (WCAG AA).
      muted: "#665449",
      accent: "#6F5D53",
      line: "rgba(41, 36, 33, 0.16)",
      inverseBackground: brand.colors.espresso,
      inverseText: brand.colors.ivory,
    },
    fonts: { display: SERIF, body: SANS },
    radius: "0px",
    cardRadius: "0px",
    borderWidth: "1px",
    sectionSpacing: "clamp(6rem, 14vw, 11rem)",
    eyebrowTracking: "0.32em",
  },
  variants: { hero: "full-bleed", intro: "veil", sections: "editorial" },
};

const blackIvory: Theme = {
  id: "black-ivory",
  name: "Black & Ivory",
  description: "High-contrast evening palette with a framed hero portrait.",
  available: true,
  tokens: {
    colors: {
      background: "#141211",
      surface: "#1E1B19",
      text: "#F3EEE7",
      muted: "#B3A89E",
      accent: "#D8CBBE",
      line: "rgba(243, 238, 231, 0.18)",
      inverseBackground: "#0C0B0A",
      inverseText: "#F3EEE7",
    },
    fonts: { display: SERIF, body: SANS },
    radius: "0px",
    cardRadius: "0px",
    borderWidth: "1px",
    sectionSpacing: "clamp(6rem, 14vw, 11rem)",
    eyebrowTracking: "0.36em",
  },
  variants: { hero: "framed", intro: "letter", sections: "editorial" },
};

const modernGarden: Theme = {
  id: "modern-garden",
  name: "Modern Garden",
  description: "Soft sage, forest green and airy layouts with botanical details.",
  available: true,
  tokens: {
    colors: {
      background: "#F4F5EE",
      surface: "#E4EADB",
      text: "#1F2A22",
      // Muted and accent greens keep small text ≥ 4.5:1 on both background and surface (WCAG AA).
      muted: "#4C5A4F",
      accent: "#4A6649",
      line: "rgba(31, 42, 34, 0.16)",
      inverseBackground: "#26352A",
      inverseText: "#F4F5EE",
    },
    fonts: { display: SERIF, body: SANS },
    radius: "999px",
    cardRadius: "2rem",
    borderWidth: "1px",
    sectionSpacing: "clamp(6.5rem, 15vw, 12rem)",
    eyebrowTracking: "0.3em",
  },
  variants: { hero: "botanical", intro: "bloom", sections: "garden" },
};

const armenianHeritage: Theme = {
  id: "armenian-heritage",
  name: "Armenian Heritage",
  description: "Ornament inspired by Armenian manuscripts and carpets. Armenian first, with the guest's language beneath.",
  available: true,
  tokens: {
    colors: {
      background: HERITAGE.parchment,
      surface: HERITAGE.vellum,
      text: HERITAGE.ink,
      muted: HERITAGE.muted,
      accent: HERITAGE.goldText,
      line: HERITAGE.line,
      inverseBackground: HERITAGE.dark.background,
      inverseText: HERITAGE.dark.text,
    },
    // Armenian falls through Cormorant (no Armenian glyphs) to Noto Serif Armenian.
    fonts: { display: SERIF, body: SERIF },
    radius: "0px",
    cardRadius: "0px",
    borderWidth: "1px",
    sectionSpacing: "4.5rem",
    eyebrowTracking: "0.32em",
  },
  variants: { hero: "heritage", intro: "monogram", sections: "heritage" },
};

/** Playfair Display + EB Garamond are loaded by the Old Money components only (see old-money/fonts.ts). */
const OM_DISPLAY = "var(--font-om-display), var(--font-display-hy), 'Times New Roman', serif";
const OM_TEXT = "var(--font-om-text), var(--font-display-hy), 'Times New Roman', serif";

const oldMoney: Theme = {
  id: "old-money",
  name: "Old Money",
  description: "Heritage serif, crest monograms and quiet luxury.",
  available: true,
  tokens: {
    colors: {
      background: OLD_MONEY.paper,
      surface: OLD_MONEY.cotton,
      text: OLD_MONEY.navy,
      muted: OLD_MONEY.muted,
      accent: OLD_MONEY.goldInk,
      line: OLD_MONEY.gold,
      inverseBackground: OLD_MONEY.night,
      inverseText: OLD_MONEY.paper,
    },
    fonts: { display: OM_DISPLAY, body: OM_TEXT },
    radius: "0px",
    cardRadius: "0px",
    borderWidth: "1px",
    sectionSpacing: "6rem",
    eyebrowTracking: "0.22em",
  },
  variants: { hero: "crest", intro: "seal", sections: "old-money" },
};

/**
 * Forum + Lora are loaded by the Romantic Film components only (see
 * romantic-film/fonts.ts). Armenian falls through both to Noto Serif Armenian.
 */
const RF_DISPLAY = "var(--font-rf-display), var(--font-rf-hy), var(--font-display-hy), 'Times New Roman', serif";
const RF_TEXT = "var(--font-rf-text), var(--font-rf-hy), var(--font-display-hy), Georgia, serif";

const romanticFilm: Theme = {
  id: "romantic-film",
  name: "Romantic Film",
  description: "Grain, light leaks and cinematic stills.",
  available: true,
  tokens: {
    colors: {
      background: FILM.paper,
      surface: FILM.ticket,
      text: FILM.ink,
      muted: FILM.muted,
      accent: FILM.amberInk,
      line: FILM.hairline,
      inverseBackground: FILM.night,
      inverseText: FILM.cream,
    },
    fonts: { display: RF_DISPLAY, body: RF_TEXT },
    radius: "2px",
    cardRadius: "2px",
    borderWidth: "1px",
    sectionSpacing: "7rem",
    eyebrowTracking: "0.24em",
  },
  variants: { hero: "title-card", intro: "leader", sections: "film" },
};

export const THEMES: Theme[] = [editorialNude, blackIvory, romanticFilm, modernGarden, oldMoney, armenianHeritage];

export const DEFAULT_THEME_ID = editorialNude.id;

export function getTheme(id: string | null | undefined): Theme {
  const theme = THEMES.find((t) => t.id === id && t.available);
  return theme ?? editorialNude;
}

export function isSelectableTheme(id: string): boolean {
  return THEMES.some((t) => t.id === id && t.available);
}

/** CSS custom properties consumed by the invitation components (see globals.css). */
export function themeStyle(theme: Theme, overrides: ThemeOverrides = {}): ThemeStyle {
  const { colors, fonts, radius, cardRadius, borderWidth, sectionSpacing, eyebrowTracking } = theme.tokens;
  return {
    "--inv-bg": colors.background,
    "--inv-surface": colors.surface,
    "--inv-text": colors.text,
    "--inv-muted": colors.muted,
    "--inv-accent": overrides.accentColor || colors.accent,
    "--inv-line": colors.line,
    "--inv-inverse-bg": colors.inverseBackground,
    "--inv-inverse-text": colors.inverseText,
    "--inv-font-display": fonts.display,
    "--inv-font-body": fonts.body,
    "--inv-radius": radius,
    "--inv-card-radius": cardRadius,
    "--inv-border": borderWidth,
    "--inv-section-space": sectionSpacing,
    "--inv-eyebrow-tracking": eyebrowTracking,
  };
}
