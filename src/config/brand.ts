/**
 * Central brand configuration.
 * Rename the product by editing this file only — every page, email-like
 * surface, metadata tag and the favicon read from here.
 */
export const brand = {
  name: "ORÉ",
  /** ASCII-safe variant for places that should avoid accents (file names, headers). */
  asciiName: "ORE",
  tagline: "Your day, beautifully told.",
  description:
    "Luxury digital wedding invitations from Armenia — personal links, elegant RSVP and a guest experience that feels designed for each person.",
  /** Short text used for the favicon / logo mark. */
  logoMark: "O",
  domain: "ore.am",
  supportEmail: "hello@ore.am",
  colors: {
    ivory: "#F5F0EA",
    nude: "#E8DDD4",
    taupe: "#BBAA9D",
    mocha: "#806D62",
    espresso: "#292421",
  },
  copyrightHolder: "ORÉ Studio",
  /** Published event used for the public template examples (/designs/[template]). */
  demoEventSlug: "anna-david",
  /**
   * Optional turnaround promise shown after an order is submitted, e.g.
   * "Your private preview will be ready within 5 working days." Leave null
   * until the business commits to a delivery time.
   */
  turnaroundNote: null as string | null,
} as const;

export type Brand = typeof brand;

/** Absolute site origin used for invitation links and social previews. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
