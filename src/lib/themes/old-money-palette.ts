/**
 * Old Money colours, exactly as the approved spec sheet lists them. Contrast
 * ratios (WCAG 2.1) are noted against the ground each colour is used on.
 */
export const OLD_MONEY = {
  /** Page ground. */
  paper: "#F7F2E8",
  /** Engraved card, reply card, venue cards, countdown cells. */
  cotton: "#FFFDF8",
  /** Welcome backdrop, desktop band, selected reply option. */
  linen: "#ECE3D1",
  /** Main text and primary buttons: 12.7 paper · 13.9 cotton · 11.1 linen. */
  navy: "#1C2B45",
  /** Ampersand, times, personal line, second initial: 10.9 paper · 12.0 cotton. */
  green: "#1E3B2F",
  /** Secondary text: 6.7 paper · 7.4 cotton · 5.9 linen. */
  muted: "#4D5566",
  /** Small-caps labels: 5.2 paper · 5.7 cotton · 4.55 linen. */
  goldInk: "#7A6233",
  /** Ornament only on light grounds (2.9:1 — never text there); text on night (5.1:1). */
  gold: "#A88C5A",
  /** Field underlines, stepper and option borders, swatch rings: 3.4 paper · 3.7 cotton. */
  fieldRule: "#7E838D",
  error: "#7A1F2B",
  /** Intro and closing ground. */
  night: "#14203A",
  /** Gold words on night: 8.1:1. */
  goldLight: "#CDB585",
  /** Secondary text on night: 8.8:1. */
  mist: "#B8C0CE",
  /** Wax seal only — three flat tones. */
  wax: { base: "#2C4A3B", shade: "#1E3B2F", light: "#4A6E5B" },
} as const;

export type OldMoneyTone = "light" | "dark";

/** Colours every Old Money ornament is drawn from, per tone. */
export function oldMoneyColors(tone: OldMoneyTone) {
  const c = OLD_MONEY;
  return tone === "dark"
    ? { ground: c.night, ink: c.paper, gold: c.gold, accent: c.goldLight, second: c.goldLight, ribbon: c.gold, ribbonText: c.night, lozenge: c.goldLight }
    : { ground: c.paper, ink: c.navy, gold: c.gold, accent: c.navy, second: c.green, ribbon: c.navy, ribbonText: c.paper, lozenge: c.navy };
}

/**
 * CSS custom properties for an Old Money subtree. "dark" (the night intro and
 * closing) also re-points the shared invitation tokens so text, labels and
 * hairlines inside switch palette.
 */
export function oldMoneyStyle(tone: OldMoneyTone): Record<`--${string}`, string> {
  const c = OLD_MONEY;
  if (tone === "light") {
    return {
      "--om-cotton": c.cotton,
      "--om-linen": c.linen,
      "--om-green": c.green,
      "--om-gold": c.gold,
      "--om-label": c.goldInk,
      "--om-rule": c.fieldRule,
      "--om-error": c.error,
      "--om-button": c.navy,
      "--om-on-button": c.paper,
    };
  }
  return {
    "--om-cotton": c.night,
    "--om-linen": c.night,
    "--om-green": c.goldLight,
    "--om-gold": c.gold,
    "--om-label": c.goldLight,
    "--om-rule": c.mist,
    "--om-error": c.goldLight,
    "--om-button": c.goldLight,
    "--om-on-button": c.night,
    "--inv-bg": c.night,
    "--inv-surface": c.night,
    "--inv-text": c.paper,
    "--inv-muted": c.mist,
    "--inv-accent": c.goldLight,
    "--inv-line": c.gold,
  };
}
