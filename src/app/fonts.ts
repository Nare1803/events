import { Cormorant_Garamond, Manrope, Noto_Sans_Armenian, Noto_Serif_Armenian } from "next/font/google";

/**
 * Display serif: Cormorant Garamond (Latin + Cyrillic). It has no Armenian
 * glyphs, so Noto Serif Armenian is chained right after it in every stack —
 * Armenian text falls through to a matching high-contrast serif.
 */
export const displayFont = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const displayArmenian = Noto_Serif_Armenian({
  subsets: ["armenian"],
  weight: ["300", "400", "500"],
  variable: "--font-display-hy",
  display: "swap",
});

export const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const bodyArmenian = Noto_Sans_Armenian({
  subsets: ["armenian"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-hy",
  display: "swap",
});

export const fontVariables = [displayFont, displayArmenian, bodyFont, bodyArmenian].map((f) => f.variable).join(" ");
