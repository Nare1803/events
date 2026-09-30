import type { InvitationView } from "@/types/invitation";
import { Stem } from "./botanical";
import { ScheduleIcon } from "./icons";
import { Reveal } from "./reveal";
import { Section } from "./section";

export function Schedule({ view }: { view: InvitationView }) {
  const { schedule, t } = view;
  if (schedule.length === 0) return null;
  if (view.theme.sections === "garden") return <GardenSchedule view={view} />;

  return (
    <Section id="schedule" eyebrow={t.schedule.eyebrow} title={t.schedule.title} tone="surface">
      <ol className="relative mx-auto max-w-3xl">
        {/* Hairline spine: left on mobile, centred on larger screens */}
        <span className="absolute bottom-3 left-[4.75rem] top-3 w-px bg-inv-line sm:left-1/2" aria-hidden="true" />
        {schedule.map((item, index) => (
          <li key={item.id} className="relative pb-14 last:pb-0 sm:pb-20">
            <Reveal delay={index * 90} className="grid grid-cols-[4.75rem_1fr] items-start sm:grid-cols-2">
              <p className="inv-display pr-6 text-right text-2xl tabular-nums sm:pr-14 sm:text-5xl">
                <time>{item.time}</time>
              </p>
              <span
                className="absolute left-[4.75rem] top-3 h-2 w-2 -translate-x-1/2 rotate-45 border border-inv-accent bg-inv-surface sm:left-1/2 sm:top-5"
                aria-hidden="true"
              />
              <div className="pl-6 sm:pl-14">
                {item.icon && <ScheduleIcon name={item.icon} size={26} className="mb-3 text-inv-accent" />}
                <h3 className="font-serif text-2xl leading-tight sm:text-3xl">{item.title}</h3>
                {item.description && <p className="mt-2 text-sm leading-7 text-inv-muted">{item.description}</p>}
                {item.locationName && (
                  <p className="inv-eyebrow mt-3 text-[0.625rem] text-inv-accent">{item.locationName}</p>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Garden timeline: rounded cards joined by a leafy stem. */
function GardenSchedule({ view }: { view: InvitationView }) {
  const { schedule, t } = view;
  return (
    <Section id="schedule" eyebrow={t.schedule.eyebrow} title={t.schedule.title} tone="surface">
      <ol className="mx-auto flex max-w-xl flex-col items-center">
        {schedule.map((item, index) => (
          <li key={item.id} className="flex w-full flex-col items-center">
            {index > 0 && <Stem className="text-inv-accent" />}
            <Reveal delay={index * 90} className="flex w-full flex-col items-center rounded-[var(--inv-card-radius)] bg-inv-bg px-6 py-9 text-center sm:px-10">
              <p className="inv-display rounded-full bg-inv-surface px-5 py-1.5 text-2xl tabular-nums text-inv-accent">
                <time>{item.time}</time>
              </p>
              {item.icon && <ScheduleIcon name={item.icon} size={26} className="mt-6 text-inv-accent" />}
              <h3 className="mt-4 font-serif text-2xl leading-tight sm:text-3xl">{item.title}</h3>
              {item.description && <p className="mt-2 max-w-sm text-sm leading-7 text-inv-muted">{item.description}</p>}
              {item.locationName && <p className="inv-eyebrow mt-4 text-[0.625rem] text-inv-accent">{item.locationName}</p>}
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
