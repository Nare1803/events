import { GuestsTable } from "@/components/admin/guests-table";
import type { GuestRow } from "@/components/admin/guest-types";
import { PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n/locales";
import { formatDateTime } from "@/lib/utils/dates";
import { eventLocales, eventTitle, invitationUrl } from "@/server/queries/events";

export default async function GuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const [guests, settings] = await Promise.all([
    db.guest.findMany({ where: { eventId: event.id }, include: { rsvp: true }, orderBy: { name: "asc" } }),
    db.invitationSettings.findUnique({ where: { eventId: event.id }, select: { defaultAllowedGuests: true } }),
  ]);
  const tz = event.timezone;

  const rows: GuestRow[] = guests.map((g) => {
    const updated = g.rsvp && g.rsvp.updatedAt > g.updatedAt ? g.rsvp.updatedAt : g.updatedAt;
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      url: invitationUrl(event.slug, g.slug),
      phone: g.phone,
      email: g.email,
      allowedGuests: g.allowedGuests,
      locale: isLocale(g.locale) ? g.locale : null,
      notes: g.notes,
      source: g.source,
      sent: g.inviteStatus === "SENT",
      openedAt: g.openedAt?.toISOString() ?? null,
      lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
      openCount: g.openCount,
      rsvp: g.rsvp ? (g.rsvp.attendance === "DECLINED" ? "DECLINED" : "ATTENDING") : null,
      guestCount: g.rsvp?.guestCount ?? null,
      transport: g.rsvp?.transportationNeeded ?? null,
      dietary: g.rsvp?.dietaryRestrictions ?? null,
      updatedAt: updated.toISOString(),
      labels: { opened: formatDateTime(g.openedAt, tz), lastOpened: formatDateTime(g.lastOpenedAt, tz), updated: formatDateTime(updated, tz) },
    };
  });

  return (
    <div>
      <PageHeader title="Guests" description={`${rows.length} guests. Every guest has a private personal link — share it by WhatsApp, Telegram or any messenger.`} />
      <GuestsTable
        eventId={event.id}
        guests={rows}
        locales={eventLocales(event)}
        defaultAllowed={settings?.defaultAllowedGuests ?? 2}
        coupleNames={eventTitle(event)}
      />
    </div>
  );
}
