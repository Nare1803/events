import { submitRsvp } from "@/lib/invitations/rsvp-service";
import { isSameOrigin, json, readJson } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation/common";
import { rsvpInputSchema } from "@/lib/validation/rsvp";

type Context = { params: Promise<{ eventSlug: string }> };

export async function POST(request: Request, { params }: Context) {
  const { eventSlug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(eventSlug)) return json({ ok: false, code: "NOT_FOUND" }, 404);
  if (!isSameOrigin(request)) return json({ ok: false, code: "FORBIDDEN" }, 403);

  const limit = rateLimit(`rsvp:${clientKey(request.headers)}`, 12, 10 * 60 * 1000);
  if (!limit.ok) {
    return json({ ok: false, code: "RATE_LIMITED" }, 429, { "Retry-After": String(limit.retryAfter) });
  }

  const body = await readJson(request);
  const parsed = rsvpInputSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, code: "VALIDATION", fieldErrors: fieldErrors(parsed.error) }, 422);

  try {
    const result = await submitRsvp(eventSlug, parsed.data);
    if (result.ok) return json(result);
    const status = { NOT_FOUND: 404, CLOSED: 409, LOCKED: 409, PERSONAL_ONLY: 403, VALIDATION: 422 }[result.code];
    return json(result, status);
  } catch {
    return json({ ok: false, code: "SERVER_ERROR" }, 500);
  }
}
