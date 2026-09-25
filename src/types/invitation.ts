import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";
import type { HeroVariant, IntroVariant, ThemeStyle } from "@/lib/themes";
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
