import "server-only";
import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import type { RenderMode } from "./load";

type Search = { lang?: string | string[]; preview?: string | string[]; embed?: string | string[] };

/**
 * `?preview=1` is honoured only for signed-in studio staff: nothing is recorded
 * and drafts are visible. `&embed=1` additionally skips the intro (editor pane).
 */
export async function resolveRenderOptions(search: Search): Promise<{ mode: RenderMode; startOpen: boolean; lang?: string }> {
  const lang = typeof search.lang === "string" ? search.lang : undefined;
  if (search.preview !== "1") return { mode: "guest", startOpen: false, lang };
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return { mode: "guest", startOpen: false, lang };
  return { mode: "staff-preview", startOpen: search.embed === "1", lang };
}
