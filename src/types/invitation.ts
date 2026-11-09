import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";
import type { HeroVariant, IntroVariant, SectionsVariant, ThemeStyle } from "@/lib/themes";
import type { Attendance, EventType, LocationKind } from "@/lib/validation/enums";

/** Fully resolved, serialisable data for one invitation render. Contains no admin-only fields. */
export type InvitationView = {
  locale: Locale;
  locales: Locale[];
  allowLocaleSwitch: boolean;
  t: Dictionary;
  /** True whenever nothing should be recorded (drafts, previews, examples). */
  isPreview: boolean;
  /** Small top banner, e.g. "Studio preview". */
  banner: string | null;
  /** Skip the intro screen (studio live preview). */
  startOpen: boolean;
  basePath: string;
  event: {
    slug: string;
    eventType: EventType;
    /** e.g. "Wedding Invitation" in the invitation language */
    label: string;
    /** Line under the names on the intro screen */
    inviteLine: string;
    partnerOne: string;
    /** Empty for single-host events */
    partnerTwo: string;
    monogram: string;
    dateISO: string;
    dotDate: string;
    longDate: string;
    weekday: string;
    time: string;
    heroImage: string | null;
    heroSubtitle: string;
    welcomeText: string;
    invitationText: string;
    closingText: string;
    closingImage: string | null;
  };
  theme: {
    id: string;
    style: ThemeStyle;
    hero: HeroVariant;
    intro: IntroVariant;
    sections: SectionsVariant;
    showMonogram: boolean;
    heroOverlay: number;
  };
  guest: { name: string; slug: string; allowedGuests: number } | null;
  rsvp: RsvpView | null;
  settings: {
    rsvpEnabled: boolean;
    rsvpOpen: boolean;
    deadlineLabel: string | null;
    allowUpdates: boolean;
    openRsvp: boolean;
    askTransportation: boolean;
    askDietary: boolean;
    askPhone: boolean;
    askMessage: boolean;
    askGuestCount: boolean;
    askCompanions: boolean;
    /** "preview": the form works but responses are not saved (review, examples, drafts). */
    rsvpMode: "live" | "preview";
    maxGuests: number;
    showCountdown: boolean;
    showGallery: boolean;
    showSchedule: boolean;
    showLocations: boolean;
  };
  gallery: GalleryImageView[];
  schedule: ScheduleItemView[];
  locations: LocationView[];
  dressCode: DressCodeView | null;
  music: MusicView | null;
  /** Extra data for the Armenian Heritage template; null for every other template. */
  heritage: HeritageView | null;
  /** Extra data for the Old Money template; null for every other template. */
  oldMoney: OldMoneyView | null;
};

/** Old Money: one language per guest, like the classic templates. */
export type OldMoneyView = {
  /** ["A", "D"], or ["M"] for a one-host event — from the names in this language. */
  initials: string[];
  /** Ribbon date, e.g. "XVIII · VII · MMXXVII". */
  romanDate: string;
  /** "Sunday, 18 July 2027" */
  fullDate: string;
  /** Reply-by date, e.g. "15 June 2027"; null without a deadline. */
  deadline: string | null;
  /** When replies closed (the deadline, or the day itself), shown once RSVP is closed. */
  closedOn: string | null;
};

/**
 * Armenian Heritage renders Armenian first (the main view is always resolved in
 * `hy`) and the guest's second language under each line.
 */
export type HeritageView = {
  /** Date in Armenian letter-numerals, e.g. "ԺԸ · Է · ՍԻԷ". */
  numeralDate: string;
  /** Initials from the Armenian names, e.g. ["Ա", "Դ"]; one for single-host events. */
  initials: string[];
  /** "Կիրակի, 18 հուլիսի 2027" */
  fullDate: string;
  /** "հունիսի 15-ը" — RSVP deadline, or null when there is none. */
  deadline: string | null;
  /** Lines in the second language, or null when the invitation is Armenian only. */
  second: HeritageSecondView | null;
};

/**
 * Couple-authored text in the second language. Resolved strictly: a missing
 * translation is an empty string (the line is simply not shown) rather than a
 * fallback to Armenian, which would print the same text twice.
 */
export type HeritageSecondView = {
  locale: Locale;
  t: Dictionary;
  label: string;
  partnerOne: string;
  partnerTwo: string;
  /** "Sunday, 18 July 2027" */
  fullDate: string;
  /** "3 pm" */
  time: string;
  /** "15 June" */
  deadline: string | null;
  /** When this guest last replied, e.g. "11 September 2026"; null without a reply. */
  respondedOn: string | null;
  heroSubtitle: string;
  welcomeText: string;
  invitationText: string;
  closingText: string;
  schedule: Record<string, { title: string; description: string; locationName: string }>;
  locations: Record<string, { name: string; description: string }>;
  dressCode: { title: string; description: string; swatches: string[] } | null;
};

export type RsvpView = {
  respondentName: string;
  attendance: Attendance;
  guestCount: number;
  companionNames: string;
  transportationNeeded: boolean | null;
  dietaryRestrictions: string;
  message: string;
  phone: string;
  submittedLabel: string;
};

export type GalleryImageView = { id: string; src: string; width: number; height: number; placeholder: string | null; alt: string };

export type ScheduleItemView = {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: string | null;
  locationId: string | null;
  locationName: string | null;
};

export type LocationView = {
  id: string;
  kind: LocationKind;
  name: string;
  description: string;
  address: string;
  image: string | null;
  mapsUrl: string;
  directionsUrl: string;
};

export type DressCodeView = {
  title: string;
  description: string;
  swatches: { hex: string; name: string }[];
  image: string | null;
};

export type MusicView = { src: string; title: string | null; artist: string | null; volume: number };
