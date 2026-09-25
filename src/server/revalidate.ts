import "server-only";
import { revalidatePath } from "next/cache";

/** Refreshes the dashboard and the public invitation (all guest links) for an event. */
export function revalidateEvent(event: { id: string; slug: string }) {
  revalidatePath(`/admin/events/${event.id}`, "layout");
  revalidatePath(`/${event.slug}`, "layout");
}
