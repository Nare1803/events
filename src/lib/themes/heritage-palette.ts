/**
 * Armenian Heritage colours. The registry turns the light values into the
 * shared invitation tokens; the ornaments and the dark closing screen read the
 * rest directly.
 *
 * Contrast (WCAG): every text colour is ≥ 4.5:1 on the background it sits on.
 * Deep gold is ornament only — it is just 3:1 on parchment.
 */
export const HERITAGE = {
  parchment: "#F2E8D5",
  vellum: "#E9DBBF",
  ink: "#1C1714",
  /** Secondary text: 6.9:1 on parchment, 6.2:1 on vellum. */
  muted: "#5B4A3B",
  /** Small gold text and labels: 5.2:1 on parchment, 4.6:1 on vellum. */
  goldText: "#7A5A17",
  /** Ornament only — never text. */
  gold: "#A8812F",
  /**
   * Deep gold nudged darker for form-field underlines and toggle borders:
   * #A8812F is 2.95:1 on parchment, this is 3.4:1 (WCAG 1.4.11 needs 3:1).
   */
  goldUi: "#9C772A",
  /** Names, section titles and every button: 7.4:1 on parchment. */
  pomegranate: "#8E1B2C",
  pomegranateHover: "#6E1222",
  line: "rgba(168, 129, 47, 0.5)",
  /** The ink closing screen. */
  dark: {
    background: "#1C1714",
    text: "#F2E8D5",
    muted: "#C9B99B",
    gold: "#D9B868",
    pomegranate: "#E07D8D",
    line: "rgba(217, 184, 104, 0.45)",
  },
} as const;

export type OrnamentTone = "light" | "dark";

/**
 * CSS custom properties for a Heritage subtree. "dark" also re-points the
 * shared invitation tokens, so everything inside the closing screen (text,
 * labels, hairlines) switches to the ink palette.
 */
export function heritageStyle(tone: OrnamentTone): Record<`--${string}`, string> {
  if (tone === "light") {
    return {
      "--her-red": HERITAGE.pomegranate,
      "--her-red-hover": HERITAGE.pomegranateHover,
      "--her-gold": HERITAGE.gold,
      "--her-gold-ui": HERITAGE.goldUi,
      "--her-on-red": HERITAGE.parchment,
    };
  }
  const d = HERITAGE.dark;
  return {
    "--her-red": d.pomegranate,
    "--her-red-hover": d.text,
    "--her-gold": d.gold,
    "--her-gold-ui": d.gold,
    "--her-on-red": d.background,
    "--inv-bg": d.background,
    "--inv-surface": d.background,
    "--inv-text": d.text,
    "--inv-muted": d.muted,
    "--inv-accent": d.gold,
    "--inv-line": d.line,
  };
}

/** The four colours every ornament is drawn from, per tone. */
export function ornamentColors(tone: OrnamentTone) {
  return tone === "dark"
    ? { ink: HERITAGE.dark.text, gold: HERITAGE.dark.gold, red: HERITAGE.dark.pomegranate, ground: HERITAGE.dark.background }
    : { ink: HERITAGE.ink, gold: HERITAGE.gold, red: HERITAGE.pomegranate, ground: HERITAGE.parchment };
}
