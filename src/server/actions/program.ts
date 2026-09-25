"use server";

import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { requireEventAccess } from "@/lib/auth/session";
import { readLocalized, resolveImageField, str } from "@/lib/forms";
import { serializeLocalized } from "@/lib/i18n/localized";
import { removeUpload, UploadError } from "@/lib/storage";
import { fieldErrors } from "@/lib/validation/common";
import { locationSchema, scheduleItemSchema } from "@/lib/validation/event";
import { revalidateEvent } from "@/server/revalidate";

type Table = "scheduleItem" | "location" | "galleryImage";

/** Swaps an item with its neighbour. Ownership is checked through eventId on every query. */
async function move(table: Table, eventId: string, id: string, direction: "up" | "down") {
  const { event } = await requireEventAccess(eventId);
  const delegate = db[table] as unknown as {
    findMany: (args: object) => Promise<{ id: string; position: number }[]>;
    update: (args: object) => Promise<unknown>;
  };
  const items = await delegate.findMany({ where: { eventId: event.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, position: true } });
  const index = items.findIndex((i) => i.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= items.length) return event;
  const reordered = [...items];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await db.$transaction(reordered.map((item, position) => delegate.update({ where: { id: item.id }, data: { position } }) as never));
  return event;
}

// --- Schedule ---------------------------------------------------------

async function readScheduleForm(eventId: string, fd: FormData) {
  const parsed = scheduleItemSchema.safeParse({ startTime: str(fd, "startTime"), icon: str(fd, "icon"), locationId: str(fd, "locationId") });
  if (!parsed.success) return { error: actionError("Please check the highlighted fields.", fieldErrors(parsed.error)) };
  const title = readLocalized(fd, "title", 120);
  if (!Object.keys(title).length) return { error: actionError("A title is required.", { title: "Required" }) };
  let locationId: string | null = parsed.data.locationId || null;
  if (locationId) {
    const location = await db.location.findFirst({ where: { id: locationId, eventId }, select: { id: true } });
    if (!location) locationId = null;
  }
  return {
    data: {
      startTime: parsed.data.startTime,
      icon: parsed.data.icon || null,
      locationId,
      title: serializeLocalized(title),
      description: serializeLocalized(readLocalized(fd, "description", 400)),
    },
  };
}

export async function createScheduleItemAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const result = await readScheduleForm(event.id, fd);
  if (result.error) return result.error;
  const count = await db.scheduleItem.count({ where: { eventId: event.id } });
  if (count >= 30) return actionError("A schedule can have at most 30 items.");
  await db.scheduleItem.create({ data: { ...result.data, eventId: event.id, position: count } });
  revalidateEvent(event);
  return actionOk("Schedule item added");
}

export async function updateScheduleItemAction(eventId: string, itemId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const result = await readScheduleForm(event.id, fd);
  if (result.error) return result.error;
  const { count } = await db.scheduleItem.updateMany({ where: { id: itemId, eventId: event.id }, data: result.data });
  if (!count) return actionError("Item not found.");
  revalidateEvent(event);
  return actionOk("Saved");
}

export async function deleteScheduleItemAction(eventId: string, itemId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  await db.scheduleItem.deleteMany({ where: { id: itemId, eventId: event.id } });
  revalidateEvent(event);
  return actionOk("Deleted");
}

export async function moveScheduleItemAction(eventId: string, itemId: string, direction: "up" | "down"): Promise<ActionState> {
  revalidateEvent(await move("scheduleItem", eventId, itemId, direction));
  return actionOk();
}

// --- Locations --------------------------------------------------------

function readLocationForm(fd: FormData) {
  const parsed = locationSchema.safeParse({
    kind: str(fd, "kind"),
    address: str(fd, "address"),
    latitude: str(fd, "latitude").trim(),
    longitude: str(fd, "longitude").trim(),
  });
  if (!parsed.success) return { error: actionError("Please check the highlighted fields.", fieldErrors(parsed.error)) };
  const name = readLocalized(fd, "name", 120);
  if (!Object.keys(name).length) return { error: actionError("A venue name is required.", { name: "Required" }) };
  const { latitude, longitude } = parsed.data;
  return {
    data: {
      kind: parsed.data.kind,
      address: parsed.data.address,
      latitude: latitude === "" || longitude === "" ? null : latitude,
      longitude: latitude === "" || longitude === "" ? null : longitude,
      name: serializeLocalized(name),
      description: serializeLocalized(readLocalized(fd, "description", 500)),
    },
  };
}

export async function createLocationAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const result = readLocationForm(fd);
  if (result.error) return result.error;
  const count = await db.location.count({ where: { eventId: event.id } });
  if (count >= 10) return actionError("An event can have at most 10 locations.");
  try {
    const image = await resolveImageField(fd, "image", null, event.id);
    await db.location.create({ data: { ...result.data, image: image.url, eventId: event.id, position: count } });
  } catch (error) {
    if (error instanceof UploadError) return actionError(error.message);
    throw error;
  }
  revalidateEvent(event);
  return actionOk("Location added");
}

export async function updateLocationAction(eventId: string, locationId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const location = await db.location.findFirst({ where: { id: locationId, eventId: event.id } });
  if (!location) return actionError("Location not found.");
  const result = readLocationForm(fd);
  if (result.error) return result.error;
  try {
    const image = await resolveImageField(fd, "image", location.image, event.id);
    await db.location.update({ where: { id: location.id }, data: { ...result.data, image: image.url } });
  } catch (error) {
    if (error instanceof UploadError) return actionError(error.message);
    throw error;
  }
  revalidateEvent(event);
  return actionOk("Saved");
}

export async function deleteLocationAction(eventId: string, locationId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const location = await db.location.findFirst({ where: { id: locationId, eventId: event.id } });
  if (!location) return actionError("Location not found.");
  await db.location.delete({ where: { id: location.id } });
  await removeUpload(location.image);
  revalidateEvent(event);
  return actionOk("Deleted");
}

export async function moveLocationAction(eventId: string, locationId: string, direction: "up" | "down"): Promise<ActionState> {
  revalidateEvent(await move("location", eventId, locationId, direction));
  return actionOk();
}

export async function moveGalleryImageAction(eventId: string, imageId: string, direction: "up" | "down"): Promise<ActionState> {
  revalidateEvent(await move("galleryImage", eventId, imageId, direction));
  return actionOk();
}
