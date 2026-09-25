import Link from "next/link";
import { Badge, buttonClass, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/dates";

const TABS = [
  { value: "all", label: "All" },
  { value: "attending", label: "Attending" },
  { value: "declined", label: "Declined" },
  { value: "transport", label: "Need transport" },
  { value: "dietary", label: "Dietary notes" },
  { value: "messages", label: "Messages" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export default async function RsvpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ eventId }, { view }] = await Promise.all([params, searchParams]);
  const { event } = await requireEventAccess(eventId);
  const tab: Tab = TABS.some((t) => t.value === view) ? (view as Tab) : "all";

  const where = {
    eventId: event.id,
    ...(tab === "attending" && { attendance: "ATTENDING" }),
    ...(tab === "declined" && { attendance: "DECLINED" }),
    ...(tab === "transport" && { transportationNeeded: true }),
    ...(tab === "dietary" && { dietaryRestrictions: { not: null } }),
    ...(tab === "messages" && { message: { not: null } }),
  };
  const [rsvps, totals] = await Promise.all([
    db.rsvp.findMany({ where, orderBy: { updatedAt: "desc" }, include: { guest: { select: { name: true, allowedGuests: true } } } }),
    db.rsvp.groupBy({ by: ["attendance"], where: { eventId: event.id }, _count: true, _sum: { guestCount: true } }),
  ]);
  const attending = totals.find((t) => t.attendance === "ATTENDING");
  const declined = totals.find((t) => t.attendance === "DECLINED");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="RSVPs"
        description={`${attending?._count ?? 0} attending responses (${attending?._sum.guestCount ?? 0} people) · ${declined?._count ?? 0} declined`}
        actions={
          <a href={`/admin/events/${event.id}/rsvps/export`} className={buttonClass("secondary")}>
            Export CSV
          </a>
        }
      />

      <nav aria-label="Filter responses" className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "all" ? `/admin/events/${event.id}/rsvps` : `/admin/events/${event.id}/rsvps?view=${t.value}`}
            aria-current={tab === t.value ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              tab === t.value ? "bg-espresso text-ivory" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:text-espresso",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rsvps.length === 0 ? (
        <EmptyState title="No responses here yet" description="Responses appear as soon as guests answer from their invitation." />
      ) : tab === "messages" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {rsvps.map((r) => (
            <Card key={r.id}>
              <p className="font-serif text-lg leading-relaxed">“{r.message}”</p>
              <p className="mt-3 text-sm text-stone-500">
                {r.respondentName} · {formatDateTime(r.updatedAt, event.timezone)}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                {["Guest", "Response", "Party", "Companions", "Transport", "Dietary", "Phone", "Message", "Updated"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rsvps.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium">{r.respondentName}</p>
                    {r.respondentName !== r.guest.name && <p className="text-xs text-stone-500">Invited as {r.guest.name}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {r.attendance === "ATTENDING" ? <Badge tone="info">Attending</Badge> : <Badge tone="warning">Declined</Badge>}
                    {r.revision > 1 && <p className="mt-1 text-xs text-stone-400">Updated {r.revision - 1}×</p>}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {r.attendance === "ATTENDING" ? `${r.guestCount} / ${r.guest.allowedGuests}` : "—"}
                  </td>
                  <td className="max-w-48 px-3 py-3 text-stone-600">{r.companionNames || "—"}</td>
                  <td className="px-3 py-3 text-stone-600">{r.transportationNeeded == null ? "—" : r.transportationNeeded ? "Yes" : "No"}</td>
                  <td className="max-w-48 px-3 py-3 text-stone-600">{r.dietaryRestrictions || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-stone-600">{r.phone || "—"}</td>
                  <td className="max-w-64 px-3 py-3 text-stone-600">
                    <span className="line-clamp-3">{r.message || "—"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-stone-500">{formatDateTime(r.updatedAt, event.timezone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
