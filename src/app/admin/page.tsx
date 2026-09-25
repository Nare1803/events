import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonClass, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PIPELINE_GROUPS } from "@/lib/projects/status";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/dates";
import { eventTitle } from "@/server/queries/events";

const EVENT_TYPE_LABEL: Record<string, string> = { WEDDING: "Wedding", ENGAGEMENT: "Engagement", BIRTHDAY: "Birthday", BAPTISM: "Baptism", OTHER: "Celebration" };

export default async function StudioHomePage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  await requireStaff();
  const { view, q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const group = PIPELINE_GROUPS.find((g) => g.key === view);

  const [counts, projects] = await Promise.all([
    db.invitationProject.groupBy({ by: ["status"], _count: true }),
    db.invitationProject.findMany({
      where: {
        ...(group ? { status: { in: group.statuses } } : view === "archived" ? { status: "ARCHIVED" } : { status: { not: "ARCHIVED" } }),
        ...(query
          ? {
              OR: [
                { reference: { contains: query.toUpperCase() } },
                { customer: { name: { contains: query } } },
                { customer: { email: { contains: query.toLowerCase() } } },
                { event: { slug: { contains: query.toLowerCase() } } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        event: { select: { partnerOneName: true, partnerTwoName: true, defaultLocale: true, eventDate: true, timezone: true, eventType: true } },
        template: { select: { name: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { revisions: { where: { status: "OPEN" } } } },
      },
    }),
  ]);
  const countOf = (statuses: string[]) => counts.filter((c) => statuses.includes(c.status)).reduce((sum, c) => sum + c._count, 0);

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <PageHeader
        title="Projects"
        description="Every invitation ORÉ is preparing, from first request to publication."
        actions={
          <Link href="/admin/projects/new" className={buttonClass("primary")}>
            New project
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {PIPELINE_GROUPS.map((g) => {
          const active = g.key === view;
          return (
            <Link
              key={g.key}
              href={active ? "/admin" : `/admin?view=${g.key}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-xl border bg-white p-4 transition-colors",
                active ? "border-espresso ring-1 ring-espresso" : "border-stone-200 hover:border-stone-400",
              )}
            >
              <p className="text-sm text-stone-500">{g.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{countOf(g.statuses)}</p>
            </Link>
          );
        })}
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2" role="search">
        {view && <input type="hidden" name="view" value={view} />}
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          name="q"
          defaultValue={query}
          placeholder="Search reference, customer, email, address…"
          className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-espresso focus:outline-none sm:w-80"
        />
        <button type="submit" className={buttonClass("secondary")}>
          Search
        </button>
        <span className="ml-auto flex gap-3 text-sm">
          {(view || query) && (
            <Link href="/admin" className="text-stone-500 underline underline-offset-4 hover:text-espresso">
              Clear filters
            </Link>
          )}
          <Link href="/admin?view=archived" className="text-stone-500 underline underline-offset-4 hover:text-espresso">
            Archived
          </Link>
        </span>
      </form>

      <div className="mt-4">
        {projects.length === 0 ? (
          <EmptyState title="No projects here" description="New requests from the order form appear here automatically." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  {["Celebration", "Customer", "Date", "Template", "Status", "Assigned", "Updated"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3">
                      <Link href={`/admin/projects/${p.id}`} className="font-medium text-espresso underline-offset-4 hover:underline">
                        {eventTitle(p.event)}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {p.reference} · {EVENT_TYPE_LABEL[p.event.eventType] ?? "Celebration"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{p.customer.name}</p>
                      <p className="text-xs text-stone-500">{p.customer.phone ?? p.customer.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDateTime(p.event.eventDate, p.event.timezone).split(",")[0]}</td>
                    <td className="px-4 py-3 text-stone-600">{p.template?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={p.status} />
                        {p._count.revisions > 0 && (
                          <span className="text-xs text-red-700">
                            {p._count.revisions} open request{p._count.revisions === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{p.assignedTo?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDateTime(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
