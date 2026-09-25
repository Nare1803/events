/** Browser event fired after any successful studio save, so the live preview can refresh. */
export const SAVED_EVENT = "ore:saved";

export function notifySaved() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SAVED_EVENT));
}
