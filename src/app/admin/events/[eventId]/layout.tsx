import Link from "next/link";
import { EventNav } from "@/components/admin/event-nav";
import { LivePreview } from "@/components/admin/live-preview";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireEventAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils/dates";
import { eventTitle } from "@/server/queries/events";

export default async function EventEditorLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event } = await requireEventAccess(eventId);
  const project = await db.invitationProject.findUnique({ where: { eventId: event.id }, select: { id: true, reference: true, status: true } });

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          {project ? (
            <Link href={`/admin/projects/${project.id}`} className="text-xs font-medium text-stone-500 hover:text-espresso">
              ← Project {project.reference}
            </Link>
          ) : (
            <Link href="/admin" className="text-xs font-medium text-stone-500 hover:text-espresso">
              ← Projects
            </Link>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="font-serif text-3xl">{eventTitle(event)}</p>
            {project && <StatusBadge status={project.status} />}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {formatDateTime(event.eventDate, event.timezone)} · /{event.slug} · {event.status === "PUBLISHED" ? "live" : event.status === "ARCHIVED" ? "archived" : "private draft"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)_380px]">
        <aside className="min-w-0">
          <EventNav eventId={event.id} />
        </aside>
        <main className="min-w-0">{children}</main>
        <LivePreview src={`/${event.slug}?preview=1&embed=1`} fullScreenHref={`/${event.slug}?preview=1`} />
      </div>
    </div>
  );
}
