/**
 * Marketing copy for the public website and the order form, kept in one place.
 * Written in English for V1; the structure is ready for Armenian and Russian
 * versions (add sibling objects and pick by locale).
 */
export const site = {
  nav: { designs: "Designs", how: "How it works", packages: "Packages", cta: "Create my invitation" },
  hero: {
    eyebrow: "Digital invitations · Made in Yerevan",
    title: "Invitations that feel like your celebration.",
    text: "Tell us about your day. We'll take care of the rest — every word, every photograph, every guest's personal link.",
    primary: "Create my invitation",
    secondary: "Explore designs",
  },
  statement: { title: "You celebrate. We create.", text: "ORÉ is a small design studio. We turn your story, your photographs and your plans into an invitation your guests will open again and again." },
  how: {
    eyebrow: "How it works",
    title: "Four simple steps",
    steps: [
      { n: "01", title: "Choose your style", text: "Browse our collections and pick the one that feels like you." },
      { n: "02", title: "Tell us about your day", text: "Share your names, photos, schedule and venues in one calm form — at your own pace." },
      { n: "03", title: "We create your invitation", text: "Our studio writes, designs and personalises it for you. You review a private preview and request any changes." },
      { n: "04", title: "Share it with your guests", text: "Each guest receives a personal link that greets them by name. You follow every reply as it arrives." },
    ],
  },
  designs: { eyebrow: "Collections", title: "Designs", text: "Every collection is refined, mobile-first and available in Armenian, English and Russian.", all: "Explore all designs", view: "View live example", choose: "Choose this style", soon: "Coming soon" },
  experience: {
    eyebrow: "The experience",
    title: "Made personally for your celebration.",
    items: [
      { title: "Addressed to each guest", text: "“For Naz” — every invitation opens with your guest's name and remembers their answer." },
      { title: "Replies, beautifully handled", text: "Attendance, companions, dietary notes and transport — gathered for you in one place." },
      { title: "Music, venues & the day", text: "A gentle soundtrack, a timeline of the day and one-tap directions to every venue." },
      { title: "Հայերեն · English · Русский", text: "Your invitation speaks your guests' language, with typography designed for Armenian script." },
    ],
  },
  packages: { eyebrow: "Packages", title: "Choose how much we take care of", onRequest: "Price on request", cta: "Start with this package", popular: "Most chosen" },
  closing: { title: "Tell us about your day.", text: "It takes about fifteen minutes. We'll take it from there.", cta: "Create my invitation" },
  footer: { studio: "A digital invitation studio in Yerevan, Armenia.", contact: "Contact", studioLogin: "Studio" },
} as const;

/** Order-form copy. */
export const intakeCopy = {
  title: "Create your invitation",
  intro: "Share everything you'd like us to know. Nothing is published until you approve it.",
  saved: "Your progress is saved on this device.",
  steps: ["Your event", "Style", "Your story", "Photos", "Music", "The day", "Dress code", "RSVP", "Guests", "Notes", "Review"],
  next: "Continue",
  back: "Back",
  submit: "Submit my invitation request",
  submitting: "Sending…",
  thanksTitle: "Thank you.",
  thanksText: "We've received everything we need to begin creating your invitation.",
  thanksNext: "We'll be in touch with a private preview link. You can close this page.",
  reference: "Your reference",
} as const;
