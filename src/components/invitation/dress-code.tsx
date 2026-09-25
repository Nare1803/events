import Image from "next/image";
import type { InvitationView } from "@/types/invitation";
import { Reveal } from "./reveal";
import { Section } from "./section";

export function DressCode({ view }: { view: InvitationView }) {
  const { dressCode, t } = view;
  if (!dressCode) return null;

  return (
    <Section id="dress-code" tone="surface">
      <div className="mx-auto grid max-w-5xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <Reveal className="text-center md:text-left">
          <p className="inv-eyebrow text-inv-accent">{t.dressCode.eyebrow}</p>
          <h2 className="inv-display mt-5 text-5xl sm:text-6xl">{dressCode.title}</h2>
          {dressCode.description && <p className="mt-6 leading-7 text-inv-muted">{dressCode.description}</p>}

          {dressCode.swatches.length > 0 && (
            <div className="mt-12">
              <p className="inv-eyebrow text-[0.625rem] text-inv-muted">{t.dressCode.palette}</p>
              <ul className="mt-6 flex flex-wrap justify-center gap-6 md:justify-start">
                {dressCode.swatches.map((swatch) => (
                  <li key={swatch.hex} className="flex w-16 flex-col items-center gap-3">
                    <span
                      className="block h-14 w-14 rounded-full border border-inv-line"
                      style={{ backgroundColor: swatch.hex }}
                      aria-hidden="true"
                    />
                    <span className="text-center text-xs leading-tight">{swatch.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>

        {dressCode.image && (
          <Reveal variant="image" delay={150}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-t-full bg-inv-bg">
              <Image src={dressCode.image} alt="" fill sizes="(min-width: 768px) 384px, 90vw" quality={80} className="object-cover" />
            </div>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
