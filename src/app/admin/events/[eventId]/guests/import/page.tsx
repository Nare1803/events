import Link from "next/link";
import { GuestImport } from "@/components/admin/guest-import";
import { PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function ImportGuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const guests = await db.guest.findMany({ where: { eventId: event.id }, select: { name: true, phone: true, email: true } });
  const existing = {
    names: guests.map((g) => g.name),
    contacts: guests.flatMap((g) => [g.phone, g.email]).filter((v): v is string => !!v),
  };

  return (
    <div>
      <Link href={`/admin/events/${event.id}/guests`} className="text-sm text-stone-500 hover:text-espresso">
        ← Guests
      </Link>
      <PageHeader title="Import guests" description="Upload your guest list; each guest receives a personal invitation link automatically." />
      <GuestImport eventId={event.id} existing={existing} />
    </div>
  );
}
