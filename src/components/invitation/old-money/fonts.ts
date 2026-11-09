import { EB_Garamond, Playfair_Display } from "next/font/google";

/**
 * Old Money faces, exposed as CSS variables on the Old Money subtrees only
 * (`oldMoneyFontVars`). Armenian falls through to Noto Serif Armenian, which
 * the root layout already provides.
 *
 * preload is off on purpose: next/font preloads per route, and every
 * invitation route imports every template — preloading here would make all
 * invitations download these files, whatever template they use. With
 * display: swap and metric-matched fallbacks the swap is barely visible.
 */
export const oldMoneyDisplay = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-om-display",
  display: "swap",
  preload: false,
});

export const oldMoneyText = EB_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-om-text",
  display: "swap",
  preload: false,
});

export const oldMoneyFontVars = `${oldMoneyDisplay.variable} ${oldMoneyText.variable}`;
