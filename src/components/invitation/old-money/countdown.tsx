"use client";

import type { Dictionary } from "@/lib/i18n";
import { useCountdown, type Remaining } from "../countdown";
import { Reveal } from "../reveal";
import { Divider, LaurelSprig } from "./ornaments";
import { Screen, SectionHeader } from "./primitives";

const UNITS: (keyof Remaining)[] = ["days", "hours", "minutes", "seconds"];

/** 2×2 cotton cells on 1px gold lines; "The day has come" replaces the grid on the day itself. */
export function OldMoneyCountdown({ dateISO, t, dateLine }: { dateISO: string; t: Dictionary["countdown"]; dateLine: string }) {
  const { remaining, finished } = useCountdown(dateISO);

  if (finished) {
    return (
      <Screen id="countdown" labelledBy="countdown-heading" className="text-center">
        <Reveal className="flex flex-col items-center">
          <LaurelSprig width={132} />
          <h2 id="countdown-heading" role="status" className="om-day-has-come mt-8">
            {t[finished]}
          </h2>
          <p className="om-date mt-5">{dateLine}</p>
          <Divider className="mt-9" />
        </Reveal>
      </Screen>
    );
  }

  return (
    <Screen id="countdown" labelledBy="countdown-heading" className="text-center">
      <SectionHeader id="countdown-heading" label={t.eyebrow} />
      <Reveal delay={100}>
        {/* The gold ground shows through the 1px gaps as the dividing lines. */}
        <dl className="mx-auto mt-8 grid max-w-[24rem] grid-cols-2 gap-px border border-om-gold bg-om-gold">
          {UNITS.map((key) => (
            <div key={key} className="flex flex-col-reverse items-center gap-2 bg-om-cotton px-2 py-7">
              <dt className="om-label om-label-sm">{t[key]}</dt>
              <dd className="om-numeral" suppressHydrationWarning>
                {remaining ? String(remaining[key]).padStart(2, "0") : "··"}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <Reveal delay={180}>
        <p className="om-date mt-8">{dateLine}</p>
        <Divider className="mx-auto mt-9" />
      </Reveal>
    </Screen>
  );
}
