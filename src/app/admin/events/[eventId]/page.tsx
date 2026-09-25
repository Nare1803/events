import Link from "next/link";
import { RsvpProgress, ViewsChart } from "@/components/admin/charts";
import { Card, CardHeader, PageHeader } from "@/components/ui/primitives";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { getEventStats } from "@/server/queries/events";

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const [stats, recent] = await Promise.all([
    getEventStats(event.id, event.timezone),
    db.rsvp.findMany({
      where: { eventId: event.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, respondentName: true, attendance: true, guestCount: true, updatedAt: true },
    }),
  ]);
  const pct = (n: number) => (stats.invited ? `${Math.round((n / stats.invited) * 100)}% of invited` : undefined);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description="How your invitation is being received." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Invited" value={stats.invited} sub="guest records" />
        <Stat label="Opened" value={stats.opened} sub={pct(stats.opened)} />
        <Stat label="Responded" value={stats.responded} sub={pct(stats.responded)} />
        <Stat label="Attending" value={stats.attending} sub={`${stats.headcount} people in total`} />
        <Stat label="Declined" value={stats.declined} />
        <Stat label="No response" value={stats.awaiting} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="RSVP progress" description={`${stats.responded} of ${stats.invited} invitations answered`} />
          <RsvpProgress stats={stats} />
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-4 text-sm">
            <div>
              <dt className="text-stone-500">Need transportation</dt>
              <dd className="text-lg font-semibold tabular-nums">{stats.transport}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Dietary notes</dt>
              <dd className="text-lg font-semibold tabular-nums">{stats.dietary}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Invitation views" description="Anonymous daily page views · last 21 days" />
          <ViewsChart days={stats.days} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Latest responses"
          action={
            <Link href={`/admin/events/${event.id}/rsvps`} className="text-sm font-medium text-espresso underline underline-offset-4">
              All responses
            </Link>
          }
        />
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500">No responses yet. Share personal links from the Guests page.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium">{r.respondentName}</span>
                <span className="flex items-center gap-4 text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: r.attendance === "ATTENDING" ? "#1F72B8" : "#C8663A" }}
                      aria-hidden="true"
                    />
                    {r.attendance === "ATTENDING" ? `Attending · ${r.guestCount}` : "Declined"}
                  </span>
                  <span>{formatDateTime(r.updatedAt, event.timezone)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
