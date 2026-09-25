"use server";

import { db } from "@/lib/db";
import { actionError, actionOk, type ActionState } from "@/lib/actions";
import { requireEventAccess } from "@/lib/auth/session";
import { MAX_GALLERY_IMAGES } from "@/lib/invitations/limits";
import { str } from "@/lib/forms";
import { isUploadFile, removeUpload, storeImage, UploadError } from "@/lib/storage";
import { cleanLine } from "@/lib/validation/sanitize";
import { revalidateEvent } from "@/server/revalidate";

export async function uploadGalleryImagesAction(eventId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const files = fd.getAll("photos").filter(isUploadFile);
  if (!files.length) return actionError("Choose at least one photo.", { photos: "Required" });

  const count = await db.galleryImage.count({ where: { eventId: event.id } });
  const room = MAX_GALLERY_IMAGES - count;
  if (room <= 0) return actionError(`The gallery holds up to ${MAX_GALLERY_IMAGES} photos. Remove one to add another.`);

  let added = 0;
  try {
    for (const file of files.slice(0, room)) {
      const image = await storeImage(event.id, file);
      await db.galleryImage.create({
        data: {
          eventId: event.id,
          position: count + added,
          src: image.url,
          width: image.width,
          height: image.height,
          placeholder: image.placeholder,
        },
      });
      added++;
    }
  } catch (error) {
    if (error instanceof UploadError) {
      revalidateEvent(event);
      return actionError(added ? `${added} photo(s) added. ${error.message}` : error.message);
    }
    throw error;
  }
  revalidateEvent(event);
  const skipped = files.length - added;
  return actionOk(`${added} photo${added === 1 ? "" : "s"} added${skipped ? ` — ${skipped} skipped (gallery is full)` : ""}`);
}

export async function updateGalleryAltAction(eventId: string, imageId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const alt = cleanLine(str(fd, "alt")).slice(0, 160);
  const { count } = await db.galleryImage.updateMany({ where: { id: imageId, eventId: event.id }, data: { alt } });
  if (!count) return actionError("Photo not found.");
  revalidateEvent(event);
  return actionOk("Saved");
}

export async function deleteGalleryImageAction(eventId: string, imageId: string): Promise<ActionState> {
  const { event } = await requireEventAccess(eventId);
  const image = await db.galleryImage.findFirst({ where: { id: imageId, eventId: event.id } });
  if (!image) return actionError("Photo not found.");
  await db.galleryImage.delete({ where: { id: image.id } });
  await removeUpload(image.src);
  revalidateEvent(event);
  return actionOk("Photo removed");
}
