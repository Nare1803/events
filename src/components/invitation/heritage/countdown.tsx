"use client";

import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locales";
import { useCountdown, type Remaining } from "../countdown";
import { Reveal } from "../reveal";
import { CarpetBand, SectionHeading } from "./ornaments";
import { Page, Tr } from "./primitives";

type Props = {
  dateISO: string;
  t: Dictionary["countdown"];
  second: { locale: Locale; t: Dictionary["countdown"] } | null;
  /** "Կիրակի, 18 հուլիսի 2027 · 15:00" */
  dateLine: string;
  /** "Sunday, 18 July 2027 · 3 pm" */
  dateLine2: string | null;
};

const UNITS: (keyof Remaining)[] = ["days", "hours", "minutes", "seconds"];

/** Live countdown to the ceremony start (the instant already carries the event's timezone). */
export function HeritageCountdown({ dateISO, t, second, dateLine, dateLine2 }: Props) {
  const { remaining, finished } = useCountdown(dateISO);

  return (
    <Page id="countdown" labelledBy="countdown-heading">
      <Reveal>
        <SectionHeading id="countdown-heading" hy={t.eyebrow} translation={second?.t.eyebrow} lang={second?.locale} />
      </Reveal>

      <Reveal delay={120} className="mt-10">
        {finished ? (
          <p role="status" className="her-title">
            {t[finished]}
            <Tr text={second?.t[finished]} lang={second?.locale} className="mt-2 text-[1.3125rem]" />
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            {UNITS.map((key) => (
              <div key={key} className="border border-her-gold p-[3px]">
                <div className="flex flex-col-reverse items-center gap-2 border border-inv-line bg-inv-surface px-2 py-5">
                  <dt className="flex flex-col items-center">
                    <span className="text-[0.9375rem] lowercase leading-tight">{t[key]}</span>
                    {second && (
                      <span lang={second.locale} className="her-label mt-1">
                        {second.t[key]}
                      </span>
                    )}
                  </dt>
                  <dd className="inv-display text-[2.75rem] leading-none tabular-nums" suppressHydrationWarning>
                    {remaining ? String(remaining[key]).padStart(2, "0") : "··"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </Reveal>

      <Reveal delay={200} className="mt-8">
        <p className="text-[1.0625rem] leading-7">{dateLine}</p>
        <Tr text={dateLine2} lang={second?.locale} className="text-base leading-6" />
      </Reveal>

      <CarpetBand className="mt-10" />
    </Page>
  );
}
