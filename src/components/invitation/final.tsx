import Image from "next/image";
import { brand } from "@/config/brand";
import { interpolate } from "@/lib/i18n";
import { displayNames } from "@/lib/invitations/monogram";
import { cn } from "@/lib/utils/cn";
import type { InvitationView } from "@/types/invitation";
import { Sprig } from "./botanical";
import { Reveal } from "./reveal";
import { Multiline } from "./section";

export function Final({ view }: { view: InvitationView }) {
  const { event, theme, t } = view;
  const garden = theme.sections === "garden";
  return (
    <footer className="relative isolate overflow-hidden bg-inv-inverse-bg text-inv-inverse-text">
      {event.closingImage && (
        <div className="absolute inset-0 -z-10 opacity-40" aria-hidden="true">
          <Image src={event.closingImage} alt="" fill sizes="100vw" quality={70} className="object-cover" />
        </div>
      )}
      {garden && (
        /* Garden arch echoing the intro screen */
        <div className="pointer-events-none absolute inset-x-5 bottom-16 top-8 rounded-t-full rounded-b-[2.5rem] border border-current/25 sm:inset-x-10" aria-hidden="true" />
      )}
      <div className="flex min-h-[90svh] flex-col items-center justify-center px-6 py-28 text-center">
        {garden && (
          <Reveal className="mb-10">
            <Sprig className="opacity-80" />
          </Reveal>
        )}
        {theme.showMonogram && (
          <Reveal>
            <p className="flex h-20 w-20 items-center justify-center rounded-full border border-current/40 font-serif text-xl italic">
              {event.monogram}
            </p>
          </Reveal>
        )}
        {event.closingText && (
          <Reveal delay={120} className="mt-12">
            <p
              className={cn(
                "inv-display",
                garden
                  ? "max-w-2xl text-[2.25rem] italic leading-[1.15] sm:text-6xl"
                  : "text-[2.5rem] uppercase leading-[1.05] tracking-[0.04em] sm:text-7xl",
              )}
            >
              <Multiline text={event.closingText} />
            </p>
          </Reveal>
        )}
        <Reveal delay={240} className="mt-12 flex flex-col items-center gap-5">
          <p className="font-serif text-3xl italic">
            {displayNames(event.partnerOne, event.partnerTwo)}
          </p>
          <p className="inv-eyebrow tracking-[0.42em]">
            <time dateTime={event.dateISO}>{event.dotDate}</time>
          </p>
        </Reveal>
      </div>
      <p className="inv-eyebrow pb-8 text-center text-[0.575rem] opacity-50">
        {interpolate(t.final.madeWith, { brand: brand.name })}
      </p>
    </footer>
  );
}
