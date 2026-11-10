import { Forum, Lora, Noto_Serif_Armenian } from "next/font/google";

/**
 * Romantic Film faces, exposed as CSS variables on its subtrees only
 * (`filmFontVars`). Forum has no Armenian or bold; Lora has no Armenian, so
 * Armenian falls through both to Noto Serif Armenian — loaded here as the
 * variable font because the Armenian labels need weight 600, which the root
 * layout does not load.
 *
 * preload is off on purpose: next/font preloads per route, and every
 * invitation route imports every template — preloading here would make all
 * invitations download these files, whatever template they use.
 */
export const filmDisplay = Forum({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-rf-display",
  display: "swap",
  preload: false,
});

export const filmText = Lora({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-rf-text",
  display: "swap",
  preload: false,
});

export const filmArmenian = Noto_Serif_Armenian({
  subsets: ["armenian"],
  variable: "--font-rf-hy",
  display: "swap",
  preload: false,
});

export const filmFontVars = `${filmDisplay.variable} ${filmText.variable} ${filmArmenian.variable}`;
