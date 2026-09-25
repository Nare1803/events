import "server-only";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/utils/dates";

/**
 * Privacy-conscious analytics: we keep per-guest open timestamps (so the couple
 * knows who has seen the invitation) and anonymous per-day counters. No IP
 * addresses, user agents, device fingerprints or third-party trackers.
 */
async function bumpDaily(eventId: string, timezone: string, field: "views" | "rsvps") {
  const day = dayKey(new Date(), timezone);
  await db.eventDailyStat.upsert({
    where: { eventId_day: { eventId, day } },
    create: { eventId, day, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

export async function recordInvitationOpen(event: { id: string; timezone: string }, guestId?: string | null) {
  const now = new Date();
  await bumpDaily(event.id, event.timezone, "views");
  if (!guestId) return;
  const guest = await db.guest.findUnique({ where: { id: guestId }, select: { openedAt: true, eventId: true } });
  if (!guest || guest.eventId !== event.id) return;
  await db.guest.update({
    where: { id: guestId },
    data: { openedAt: guest.openedAt ?? now, lastOpenedAt: now, openCount: { increment: 1 } },
  });
}

export async function recordRsvpSubmitted(event: { id: string; timezone: string }) {
  await bumpDaily(event.id, event.timezone, "rsvps");
}
