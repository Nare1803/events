import type { CSSProperties } from "react";

export type HeroVariant = "full-bleed" | "framed";
export type IntroVariant = "veil" | "letter";

export type ThemeTokens = {
  colors: {
    /** Page background */
    background: string;
    /** Slightly contrasting surface for alternating sections */
    surface: string;
    text: string;
    muted: string;
    accent: string;
    line: string;
    /** Dark band used for the hero overlay, intro screen and closing section */
    inverseBackground: string;
    inverseText: string;
  };
  /** CSS font-family stacks; next/font variables are defined in the root layout. */
  fonts: { display: string; body: string };
  radius: string;
  borderWidth: string;
  /** Vertical rhythm between invitation sections */
  sectionSpacing: string;
  /** Letter-spacing for uppercase eyebrow labels */
  eyebrowTracking: string;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  /** Only available themes can be selected; others are previewed as "coming soon". */
  available: boolean;
  tokens: ThemeTokens;
  variants: { hero: HeroVariant; intro: IntroVariant };
};

export type ThemeOverrides = { accentColor?: string | null };

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;
