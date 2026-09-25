import { db } from "@/lib/db";
import { recordInvitationOpen } from "@/lib/analytics/track";
import { isSameOrigin, json, readJson } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { openEventSchema } from "@/lib/validation/rsvp";

type Context = { params: Promise<{ eventSlug: string }> };

/**
 * Called by the invitation page after it renders in a real browser (link-preview
 * bots don't run JavaScript, so they don't count as "opened").
 */
export async function POST(request: Request, { params }: Context) {
  const { eventSlug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(eventSlug) || !isSameOrigin(request)) return json({ ok: false }, 400);

  if (!rateLimit(`open:${clientKey(request.headers)}`, 30, 10 * 60 * 1000).ok) return json({ ok: false }, 429);

  const parsed = openEventSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return json({ ok: false }, 422);

  const event = await db.event.findUnique({ where: { slug: eventSlug }, select: { id: true, timezone: true, status: true } });
  if (!event || event.status !== "PUBLISHED") return json({ ok: false }, 404);

  let guestId: string | null = null;
  if (parsed.data.guestSlug) {
    const guest = await db.guest.findUnique({
      where: { eventId_slug: { eventId: event.id, slug: parsed.data.guestSlug } },
      select: { id: true },
    });
    guestId = guest?.id ?? null;
  }

  await recordInvitationOpen(event, guestId);
  return json({ ok: true });
}
