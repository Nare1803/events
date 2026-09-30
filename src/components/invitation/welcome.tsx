import { interpolate } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { InvitationView } from "@/types/invitation";
import { Reveal } from "./reveal";
import { Multiline, Section, SectionOrnament } from "./section";

export function Welcome({ view }: { view: InvitationView }) {
  const { event, guest, t } = view;
  const garden = view.theme.sections === "garden";
  return (
    <Section id="welcome" className="text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <Reveal>
          <p className="inv-eyebrow text-inv-accent">{t.welcome.eyebrow}</p>
        </Reveal>

        {event.welcomeText && (
          <Reveal delay={120} as="blockquote" className="mt-10">
            <p className="inv-display text-[2rem] italic leading-[1.2] sm:text-[3.25rem] sm:leading-[1.15]">
              <Multiline text={event.welcomeText} />
            </p>
          </Reveal>
        )}

        {guest && (
          <Reveal delay={200}>
            <p className="mt-10 font-serif text-xl text-inv-muted sm:text-2xl">
              {interpolate(t.welcome.personal, { name: guest.name })}
            </p>
          </Reveal>
        )}

        <Reveal delay={260} className="my-14">
          {garden ? <SectionOrnament className="mb-0" /> : <span className="inv-rule mx-auto" aria-hidden="true" />}
        </Reveal>

        {event.invitationText && (
          <Reveal delay={300}>
            <p className="mx-auto max-w-xl text-[0.975rem] leading-8 text-inv-muted">{event.invitationText}</p>
          </Reveal>
        )}

        <Reveal
          delay={360}
          className={cn(
            "mt-14 flex w-full max-w-md flex-col items-center gap-4 py-8",
            garden ? "rounded-[var(--inv-card-radius)] bg-inv-surface px-6 py-10" : "border-y border-inv-line",
          )}
        >
          <p className="inv-eyebrow text-inv-muted">{event.weekday}</p>
          <p className="font-serif text-3xl sm:text-4xl">
            <time dateTime={event.dateISO}>{event.longDate}</time>
          </p>
          <p className="inv-eyebrow text-inv-muted">{event.time}</p>
        </Reveal>
      </div>
    </Section>
  );
}
