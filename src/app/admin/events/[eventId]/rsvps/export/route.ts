import { isStaffRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buildGuestCsv, csvResponse } from "@/lib/guests/export";

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return new Response("Unauthorized", { status: 401 });
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, slug: true } });
  if (!event) return new Response("Not found", { status: 404 });
  return csvResponse(await buildGuestCsv(event), event.slug);
}
