import type { Locale } from "@/lib/i18n/locales";

/** Serializable guest row passed from the server page to the guests table. */
export type GuestRow = {
  id: string;
  name: string;
  slug: string;
  url: string;
  phone: string | null;
  email: string | null;
  allowedGuests: number;
  locale: Locale | null;
  notes: string | null;
  source: string;
  sent: boolean;
  openedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  rsvp: "ATTENDING" | "DECLINED" | null;
  guestCount: number | null;
  transport: boolean | null;
  dietary: string | null;
  updatedAt: string;
  /** Pre-formatted in the event timezone on the server (avoids hydration mismatches). */
  labels: { opened: string; lastOpened: string; updated: string };
};
