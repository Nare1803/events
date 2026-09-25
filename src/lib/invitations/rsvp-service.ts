import "server-only";
import { Prisma } from "@prisma/client";
import { siteUrl } from "@/config/brand";
import { db } from "@/lib/db";
import { recordRsvpSubmitted } from "@/lib/analytics/track";
import { guestSlug as makeGuestSlug } from "@/lib/utils/slug";
import type { RsvpInput } from "@/lib/validation/rsvp";

export type RsvpResult =
  | { ok: true; guestSlug: string | null; personalUrl: string | null }
  | { ok: false; code: "NOT_FOUND" | "CLOSED" | "LOCKED" | "PERSONAL_ONLY" | "VALIDATION"; fieldErrors?: Record<string, string> };

/** Window in which a second general-link RSVP with the same name is treated as a duplicate. */
const PUBLIC_DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

const normalizeName = (name: string) => name.trim().toLocaleLowerCase().replace(/\s+/g, " ");

function rsvpData(input: RsvpInput) {
  const attending = input.attendance === "ATTENDING";
  return {
    respondentName: input.name,
    attendance: input.attendance,
    guestCount: attending ? input.guestCount : 0,
    companionNames: attending && input.guestCount > 1 ? (input.companionNames ?? null) : null,
    transportationNeeded: attending ? (input.transportationNeeded ?? null) : null,
    dietaryRestrictions: attending ? (input.dietaryRestrictions ?? null) : null,
    message: input.message ?? null,
    phone: input.phone ?? null,
    locale: input.locale ?? null,
  };
}

/**
 * Creates or updates an RSVP. All business rules are enforced here — the
 * client form is a convenience, never the source of truth.
 */
export async function submitRsvp(eventSlug: string, rawInput: RsvpInput): Promise<RsvpResult> {
  const event = await db.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true, slug: true, status: true, eventDate: true, timezone: true, invitationSettings: true },
  });
  if (!event || event.status !== "PUBLISHED") return { ok: false, code: "NOT_FOUND" };

  const settings = event.invitationSettings;
  const now = new Date();
  if (!settings?.rsvpEnabled || (settings.rsvpDeadline && settings.rsvpDeadline <= now) || event.eventDate <= now) {
    return { ok: false, code: "CLOSED" };
  }

  // Honeypot filled → pretend success without storing anything.
  if (rawInput.website) return { ok: true, guestSlug: null, personalUrl: null };

  // Only keep answers to questions this invitation actually asks.
  const attending = rawInput.attendance === "ATTENDING";
  const input: RsvpInput = {
    ...rawInput,
    guestCount: settings.askGuestCount ? rawInput.guestCount : attending ? 1 : 0,
    companionNames: settings.askCompanions ? rawInput.companionNames : null,
    transportationNeeded: settings.askTransportation ? rawInput.transportationNeeded : null,
    dietaryRestrictions: settings.askDietary ? rawInput.dietaryRestrictions : null,
    message: settings.askMessage ? rawInput.message : null,
    phone: settings.askPhone ? rawInput.phone : null,
  };
  if (attending && input.guestCount < 1) return { ok: false, code: "VALIDATION", fieldErrors: { guestCount: "Invalid" } };

  // --- Personal link ----------------------------------------------------
  if (input.guestSlug) {
    const guest = await db.guest.findUnique({
      where: { eventId_slug: { eventId: event.id, slug: input.guestSlug } },
      include: { rsvp: { select: { id: true } } },
    });
    if (!guest) return { ok: false, code: "NOT_FOUND" };
    if (guest.rsvp && !settings.allowRsvpUpdates) return { ok: false, code: "LOCKED" };
    if (attending && input.guestCount > Math.max(1, guest.allowedGuests)) {
      return { ok: false, code: "VALIDATION", fieldErrors: { guestCount: "Too many guests" } };
    }

    const data = rsvpData(input);
    await db.$transaction([
      db.rsvp.upsert({
        where: { guestId: guest.id },
        create: { ...data, eventId: event.id, guestId: guest.id },
        update: { ...data, revision: { increment: 1 } },
      }),
      db.guest.update({
        where: { id: guest.id },
        data: {
          openedAt: guest.openedAt ?? now,
          lastOpenedAt: now,
          ...(input.phone && !guest.phone ? { phone: input.phone } : {}),
        },
      }),
    ]);
    if (!guest.rsvp) await recordRsvpSubmitted(event);
    return { ok: true, guestSlug: guest.slug, personalUrl: null };
  }

  // --- General link -----------------------------------------------------
  if (!settings.openRsvp) return { ok: false, code: "PERSONAL_ONLY" };
  const maxGuests = Math.max(1, settings.defaultAllowedGuests);
  if (attending && input.guestCount > maxGuests) {
    return { ok: false, code: "VALIDATION", fieldErrors: { guestCount: "Too many guests" } };
  }

  const data = rsvpData(input);

  // Idempotency: a re-submission (double tap, retry on flaky network) with the
  // same name shortly afterwards updates the response instead of duplicating it.
  const recent = await db.guest.findMany({
    where: { eventId: event.id, source: "PUBLIC_RSVP", createdAt: { gte: new Date(now.getTime() - PUBLIC_DUPLICATE_WINDOW_MS) } },
    select: { id: true, slug: true, name: true },
    take: 100,
  });
  const duplicate = recent.find((g) => normalizeName(g.name) === normalizeName(input.name));
  if (duplicate) {
    await db.rsvp.update({ where: { guestId: duplicate.id }, data: { ...data, revision: { increment: 1 } } });
    return { ok: true, guestSlug: duplicate.slug, personalUrl: `${siteUrl()}/${event.slug}/${duplicate.slug}` };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeGuestSlug(input.name);
    try {
      await db.guest.create({
        data: {
          eventId: event.id,
          name: input.name,
          slug,
          phone: input.phone ?? null,
          allowedGuests: maxGuests,
          locale: input.locale ?? null,
          source: "PUBLIC_RSVP",
          inviteStatus: "SENT",
          openedAt: now,
          lastOpenedAt: now,
          openCount: 1,
          rsvp: { create: { ...data, eventId: event.id } },
        },
      });
      await recordRsvpSubmitted(event);
      return { ok: true, guestSlug: slug, personalUrl: `${siteUrl()}/${event.slug}/${slug}` };
    } catch (error) {
      // Retry only on a slug collision; anything else is a real failure.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a unique guest link");
}
