import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { InvitationView } from "@/types/invitation";
import { ArrowIcon, PinIcon } from "./icons";
import { Reveal } from "./reveal";
import { Section } from "./section";

export function Locations({ view }: { view: InvitationView }) {
  const { locations, t } = view;
  if (locations.length === 0) return null;

  return (
    <Section id="locations" eyebrow={t.locations.eyebrow} title={t.locations.title}>
      <div className="mx-auto flex max-w-5xl flex-col gap-20 sm:gap-28">
        {locations.map((location, index) => {
          const flipped = index % 2 === 1;
          return (
            <article key={location.id} className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
              {location.image && (
                <Reveal variant="image" className={cn("md:col-span-7", flipped && "md:order-2 md:col-start-6")}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-inv-surface">
                    <Image src={location.image} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" quality={80} className="object-cover" />
                  </div>
                </Reveal>
              )}
              <Reveal
                delay={120}
                className={cn(
                  location.image ? "md:col-span-5" : "md:col-span-8 md:col-start-3 text-center",
                  flipped && location.image && "md:order-1 md:col-start-1",
                )}
              >
                <p className="inv-eyebrow text-inv-accent">{t.locations.kinds[location.kind]}</p>
                <h3 className="inv-display mt-4 text-4xl sm:text-5xl">{location.name}</h3>
                {location.description && <p className="mt-5 leading-7 text-inv-muted">{location.description}</p>}
                <p className={cn("mt-6 flex items-start gap-2 text-sm", !location.image && "justify-center")}>
                  <PinIcon size={18} className="mt-0.5 shrink-0 text-inv-accent" />
                  <span>{location.address}</span>
                </p>
                <div className={cn("mt-6 flex flex-wrap gap-x-8", !location.image && "justify-center")}>
                  <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className="inv-link">
                    {t.locations.openInMaps}
                  </a>
                  <a href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="inv-link">
                    {t.locations.directions}
                    <ArrowIcon size={14} />
                  </a>
                </div>
              </Reveal>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
