"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { requireEventAccess } from "@/lib/auth/session";
import { str } from "@/lib/forms";
import { guestSlug } from "@/lib/utils/slug";
import { fieldErrors } from "@/lib/validation/common";
import { guestFormSchema, importPayloadSchema, normalizeContact, normalizeGuestName } from "@/lib/validation/guest";
import { revalidateEvent } from "@/server/revalidate";

function parseGuestForm(fd: FormData) {
  return guestFormSchema.safeParse({
    name: str(fd, "name"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    allowedGuests: str(fd, "allowedGuests") || "1",
    locale: str(fd, "locale"),
    slug: str(fd, "slug"),
    notes: str(fd, "notes"),
  });
}

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function createGuestAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = parseGuestForm(fd);
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const { slug: customSlug, locale, ...data } = parsed.data;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.guest.create({
        data: { ...data, locale: locale || null, eventId: event.id, slug: customSlug || guestSlug(data.name), source: "ADMIN" },
      });
      revalidateEvent(event);
      return actionOk(`${data.name} added`);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      if (customSlug) return actionError("That personal link is already used by another guest.", { slug: "Already in use" });
    }
  }
  return actionError("Could not create a unique link. Please try again.");
}

export async function updateGuestAction(eventId: string, guestId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const parsed = parseGuestForm(fd);
  if (!parsed.success) return actionError("Please check the highlighted fields.", fieldErrors(parsed.error));
  const { slug, locale, ...data } = parsed.data;

  const guest = await db.guest.findFirst({ where: { id: guestId, eventId: event.id }, select: { id: true, slug: true } });
  if (!guest) return actionError("Guest not found.");
  try {
    await db.guest.update({ where: { id: guest.id }, data: { ...data, locale: locale || null, slug: slug || guest.slug } });
  } catch (error) {
    if (isUniqueViolation(error)) return actionError("That personal link is already used by another guest.", { slug: "Already in use" });
    throw error;
  }
  revalidateEvent(event);
  return actionOk("Guest updated");
}

export async function deleteGuestAction(eventId: string, guestId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const { count } = await db.guest.deleteMany({ where: { id: guestId, eventId: event.id } });
  if (!count) return actionError("Guest not found.");
  revalidateEvent(event);
  return actionOk("Guest deleted");
}

export async function setInviteSentAction(eventId: string, guestIds: string[], sent: boolean): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const ids = guestIds.filter((id) => typeof id === "string").slice(0, 2000);
  await db.guest.updateMany({
    where: { id: { in: ids }, eventId: event.id },
    data: sent ? { inviteStatus: "SENT", sentAt: new Date() } : { inviteStatus: "NOT_SENT", sentAt: null },
  });
  revalidateEvent(event);
  return actionOk(sent ? "Marked as sent" : "Marked as not sent");
}

/** Issues a fresh personal link (e.g. if the old one was forwarded). The old URL stops working. */
export async function regenerateGuestLinkAction(eventId: string, guestId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const guest = await db.guest.findFirst({ where: { id: guestId, eventId: event.id }, select: { id: true, name: true } });
  if (!guest) return actionError("Guest not found.");
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.guest.update({ where: { id: guest.id }, data: { slug: guestSlug(guest.name) } });
      revalidateEvent(event);
      return actionOk("New link created");
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return actionError("Could not create a unique link. Please try again.");
}

export async function importGuestsAction(
  eventId: string,
  rows: unknown,
  skipDuplicates: boolean,
): Promise<ActionState & { imported?: number; skipped?: number }> {
  const { event } = await requireEventAccess(eventId);
  const parsed = importPayloadSchema.safeParse(rows);
  if (!parsed.success) return actionError("Some rows are invalid. Fix them in your file and try again.");

  const existing = await db.guest.findMany({ where: { eventId: event.id }, select: { name: true, phone: true, email: true, slug: true } });
  const names = new Set(existing.map((g) => normalizeGuestName(g.name)));
  const contacts = new Set(existing.flatMap((g) => [normalizeContact(g.phone), normalizeContact(g.email)]).filter(Boolean));
  const slugs = new Set(existing.map((g) => g.slug));

  const toCreate: Prisma.GuestCreateManyInput[] = [];
  let skipped = 0;
  for (const row of parsed.data) {
    const name = normalizeGuestName(row.name);
    const rowContacts = [normalizeContact(row.phone), normalizeContact(row.email)].filter(Boolean);
    const duplicate = names.has(name) || rowContacts.some((c) => contacts.has(c));
    if (duplicate && skipDuplicates) {
      skipped++;
      continue;
    }
    let slug = guestSlug(row.name);
    while (slugs.has(slug)) slug = guestSlug(row.name);
    slugs.add(slug);
    names.add(name);
    rowContacts.forEach((c) => contacts.add(c));
    toCreate.push({
      eventId: event.id,
      name: row.name,
      phone: row.phone ?? null,
      email: row.email ?? null,
      allowedGuests: row.allowedGuests,
      slug,
      source: "IMPORT",
    });
  }

  if (toCreate.length) await db.guest.createMany({ data: toCreate });
  revalidateEvent(event);
  return { ...actionOk(`Imported ${toCreate.length} guest${toCreate.length === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}`), imported: toCreate.length, skipped };
}

export async function deleteRsvpAction(eventId: string, guestId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const { count } = await db.rsvp.deleteMany({ where: { guestId, eventId: event.id } });
  if (!count) return actionError("Response not found.");
  revalidateEvent(event);
  return actionOk("Response cleared — the guest can respond again");
}
