import "server-only";
import { db } from "@/lib/db";
import { parseLocalized } from "@/lib/i18n/localized";

export type ChecklistItem = { key: string; label: string; done: boolean; optional?: boolean; href: string; detail?: string };

/** What still needs doing before an invitation can go to the customer. */
export async function projectChecklist(eventId: string): Promise<ChecklistItem[]> {
  const event = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    include: {
      musicSettings: true,
      dressCode: true,
      invitationSettings: true,
      _count: { select: { galleryImages: true, scheduleItems: true, locations: true, guests: true } },
    },
  });
  const base = `/admin/events/${eventId}`;
  const filled = (raw: string) => Object.keys(parseLocalized(raw)).length > 0;
  const c = event._count;

  return [
    { key: "names", label: "Names & date", done: filled(event.partnerOneName), href: `${base}/invitation` },
    { key: "hero", label: "Hero photo", done: !!event.heroImage, href: `${base}/invitation` },
    { key: "welcome", label: "Welcome message", done: filled(event.welcomeText), href: `${base}/invitation` },
    { key: "gallery", label: "Photo story", done: c.galleryImages >= 3, detail: `${c.galleryImages} photos`, href: `${base}/gallery`, optional: true },
    { key: "schedule", label: "Schedule", done: c.scheduleItems > 0, detail: `${c.scheduleItems} items`, href: `${base}/schedule` },
    { key: "locations", label: "Locations", done: c.locations > 0, detail: `${c.locations} venues`, href: `${base}/locations` },
    { key: "dress", label: "Dress code", done: !!event.dressCode?.enabled, href: `${base}/invitation`, optional: true },
    {
      key: "music",
      label: "Music",
      done: !!(event.musicSettings?.enabled && event.musicSettings.rightsConfirmed),
      detail: event.musicSettings?.trackUrl && !event.musicSettings.rightsConfirmed ? "rights not confirmed" : undefined,
      href: `${base}/music`,
      optional: true,
    },
    { key: "rsvp", label: "RSVP settings", done: !!event.invitationSettings, href: `${base}/settings` },
    { key: "guests", label: "Guest list", done: c.guests > 0, detail: `${c.guests} guests`, href: `${base}/guests`, optional: true },
  ];
}
