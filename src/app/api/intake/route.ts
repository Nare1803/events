import { revalidatePath } from "next/cache";
import { isSameOrigin, json } from "@/lib/http";
import { createProjectFromIntake } from "@/lib/projects/intake-service";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation/common";
import { intakeSchema } from "@/lib/validation/intake";

const MAX_BODY = 600 * 1024; // guest lists can be long, but never megabytes

/** Order form submission → customer + draft invitation + NEW_REQUEST project. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, error: "FORBIDDEN" }, 403);
  if (!rateLimit(`intake:${clientKey(request.headers)}`, 6, 60 * 60 * 1000).ok) return json({ ok: false, error: "RATE_LIMITED" }, 429);

  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return json({ ok: false, error: "INVALID" }, 400);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "INVALID" }, 400);
  }

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: "VALIDATION", fieldErrors: fieldErrors(parsed.error) }, 422);

  // Honeypot: behave as if everything worked.
  if (parsed.data.website) return json({ ok: true, reference: null });

  try {
    const { reference } = await createProjectFromIntake(parsed.data);
    revalidatePath("/admin");
    return json({ ok: true, reference });
  } catch {
    return json({ ok: false, error: "SERVER_ERROR" }, 500);
  }
}
