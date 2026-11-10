/**
 * Romantic Film colours, exactly as the approved spec sheet lists them.
 * Contrast ratios (WCAG 2.1) are noted against the ground each colour is used on.
 */
export const FILM = {
  /** Cinema darkness: intro, hero bars, welcome, RSVP, closing, film strips, primary buttons. */
  night: "#17120F",
  /** Countdown frames and sprocket bands on darkness. */
  night2: "#241C17",
  /** Faded photo paper: countdown, programme, venues, dress code, gallery. */
  paper: "#F1E6D3",
  /** RSVP ticket stock and the call-sheet card (1.12:1 to paper, so cards on paper add a hairline). */
  ticket: "#FAF3E6",
  /** Inside text fields, option buttons and the stepper. */
  field: "#FFFDF8",
  /** All text on paper and ticket: 12.8 paper · 14.4 ticket. */
  ink: "#2B201A",
  /** Descriptions, helper text, placeholders, edge codes on paper: 6.8 paper · 7.6 ticket. */
  muted: "#5C4A3D",
  /** Label rules, venue type, call-sheet venues, light ornament strokes: 6.1 paper · 6.8 ticket. */
  amberInk: "#7E470E",
  /** "Admission" on the ticket stub: 5.3 paper · 6.0 ticket. */
  roseInk: "#8C4A48",
  /** Text on darkness and over photos: 15.2 night · 9.8 on the 0.86 scrim. */
  cream: "#F3E7D3",
  /** Secondary text on darkness: 8.2 night · 7.3 night-2. */
  dusk: "#BBA992",
  /** Text only on darkness (7.9 night); ornament only on paper (1.9). */
  amber: "#E39A3B",
  /** Ampersand and personal line on darkness (7.9 night); ornament only on paper. */
  rose: "#D79A93",
  /** Field, option and stepper borders, swatch outlines, light controls: 3.7 paper · 4.2 ticket. */
  line: "#857262",
  /** Control borders on darkness: 4.8 night. */
  lineDark: "#8F7F6E",
  /** Table rules and card edges. Decorative only — never the only edge of a control. */
  hairline: "rgba(43, 32, 26, 0.18)",
} as const;

/**
 * The palette as CSS custom properties for a Romantic Film subtree. Light and
 * dark screens pick from it through the `.rf-light` / `.rf-dark` classes
 * (globals.css), so components never hard-code a colour.
 */
export function filmStyle(): Record<`--${string}`, string> {
  const c = FILM;
  return {
    "--rf-night": c.night,
    "--rf-night-2": c.night2,
    "--rf-paper": c.paper,
    "--rf-ticket": c.ticket,
    "--rf-field": c.field,
    "--rf-ink": c.ink,
    "--rf-muted": c.muted,
    "--rf-amber-ink": c.amberInk,
    "--rf-rose-ink": c.roseInk,
    "--rf-cream": c.cream,
    "--rf-dusk": c.dusk,
    "--rf-amber": c.amber,
    "--rf-rose": c.rose,
    "--rf-line": c.line,
    "--rf-line-dark": c.lineDark,
    "--rf-hairline": c.hairline,
  };
}
