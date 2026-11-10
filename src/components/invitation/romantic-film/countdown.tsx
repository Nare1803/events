"use client";

import type { Dictionary } from "@/lib/i18n";
import { useCountdown, type Remaining } from "../countdown";
import { Reveal } from "../reveal";
import { Divider, FilmStrip, LabelRule } from "./ornaments";
import { Screen } from "./primitives";

const UNITS: (keyof Remaining)[] = ["days", "hours", "minutes", "seconds"];

/**
 * The countdown runs on a strip of film: four night-2 frames between sprocket
 * rows, live to the start time. From the start, the four frames join into one
 * that reads "The day has come". Digits cross-fade once a second (a swap with
 * reduced motion).
 */
export function FilmCountdown({
  dateISO,
  t,
  label,
  date,
  timeLine,
  n,
  seam,
}: {
  dateISO: string;
  t: Dictionary["countdown"];
  label: string;
  /** "Sunday, 18 July 2027" */
  date: string;
  /** "15:00 · Yerevan time" */
  timeLine: string;
  n: number;
  seam?: boolean;
}) {
  const { remaining, finished } = useCountdown(dateISO);
  return (
    <Screen id="countdown" labelledBy="countdown-heading" tone="light" n={n} leaks={["tr-amber", "br-rose"]} seam={seam}>
      <LabelRule n={n} label={label} as="h2" id="countdown-heading" />
      <Reveal className="mt-14 text-center lg:mt-12">
        <p className="rf-date-line">{date}</p>
        <p className="rf-small mt-1.5 text-rf-soft">{timeLine}</p>
      </Reveal>
      <Reveal delay={100} className="mx-[calc(50%-50vw)] mt-8">
        <FilmStrip inner="px-4">
          {finished ? (
            <div className="rf-frame mx-auto flex min-h-[7.75rem] max-w-[46rem] items-center justify-center px-4 py-6">
              <p role="status" className="rf-day-has-come text-center">
                {t[finished]}
              </p>
            </div>
          ) : (
            <dl className="mx-auto grid max-w-[46rem] grid-cols-4 gap-2 lg:gap-3">
              {UNITS.map((key) => (
                <div key={key} className="rf-frame flex min-w-0 flex-col-reverse items-center justify-center gap-2.5 px-1 py-7 lg:py-9">
                  <dt className="rf-unit">{t[key]}</dt>
                  <dd className="rf-digits" suppressHydrationWarning>
                    {remaining ? (
                      <span key={remaining[key]} className="rf-tick inline-block">
                        {String(remaining[key]).padStart(2, "0")}
                      </span>
                    ) : (
                      "··"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </FilmStrip>
      </Reveal>
      <Divider className="mx-auto mt-9" />
    </Screen>
  );
}
