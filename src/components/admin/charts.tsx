import type { EventStats } from "@/server/queries/events";

/** Validated with the dataviz palette checker (CVD ΔE ≥ 15, contrast ≥ 3:1 on white). */
export const RSVP_COLORS = { attending: "#1F72B8", declined: "#C8663A", awaiting: "#E7E5E4" } as const;

/** One stacked bar: attending / declined / awaiting, with a legend that carries the numbers. */
export function RsvpProgress({ stats }: { stats: EventStats }) {
  const total = Math.max(1, stats.invited);
  const segments = [
    { key: "attending", label: "Attending", value: stats.attending, color: RSVP_COLORS.attending },
    { key: "declined", label: "Declined", value: stats.declined, color: RSVP_COLORS.declined },
    { key: "awaiting", label: "Awaiting response", value: stats.awaiting, color: RSVP_COLORS.awaiting },
  ];
  const pct = (v: number) => (v / total) * 100;

  return (
    <div>
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-stone-100"
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      >
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct(s.value)}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value} (${Math.round(pct(s.value))}%)`}
            />
          ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-stone-600">
            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-stone-300/60" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span>{s.label}</span>
            <span className="font-semibold tabular-nums text-espresso">{s.value}</span>
            <span className="tabular-nums text-stone-400">{Math.round(pct(s.value))}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Daily invitation views, last 21 days. Hover or focus a bar for its value; a table is provided for screen readers. */
export function ViewsChart({ days }: { days: EventStats["days"] }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  const label = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <figure>
      <div className="relative h-36 border-b border-stone-200" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-stone-100" />
        <span className="absolute -top-1 right-0 -translate-y-full text-[10px] tabular-nums text-stone-400">{max}</span>
        <div className="flex h-full items-end gap-[2px]">
          {days.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] bg-mocha transition-opacity group-hover:opacity-80"
                style={{ height: `${d.views ? Math.max(4, (d.views / max) * 100) : 0}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-espresso px-2 py-1 text-[11px] text-white group-hover:block">
                {label(d.day)} · {d.views} view{d.views === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-stone-400" aria-hidden="true">
        <span>{label(days[0].day)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>Invitation views per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Views</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{label(d.day)}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
