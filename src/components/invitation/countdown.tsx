"use client";

import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Reveal } from "./reveal";
import { Section } from "./section";

// One shared ticker per page: all subscribers re-render once a second.
function subscribe(callback: () => void) {
  const id = window.setInterval(callback, 1000);
  return () => window.clearInterval(id);
}
const getNowSecond = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => null;

const DAY = 86_400;

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function split(total: number): Remaining {
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function Countdown({ dateISO, t }: { dateISO: string; t: Dictionary["countdown"] }) {
  // null on the server and during hydration → stable placeholders, no mismatch.
  const now = useSyncExternalStore(subscribe, getNowSecond, getServerSnapshot);
  const target = Math.floor(new Date(dateISO).getTime() / 1000);
  const diff = now === null ? null : target - now;

  const finished = diff !== null && diff <= 0;
  // Within 24h after the start we celebrate "today"; afterwards we thank guests.
  const finalMessage = finished ? (diff > -DAY ? t.today : t.past) : null;
  const remaining = diff !== null && diff > 0 ? split(diff) : null;

  const units: { key: keyof Remaining; label: string }[] = [
    { key: "days", label: t.days },
    { key: "hours", label: t.hours },
    { key: "minutes", label: t.minutes },
    { key: "seconds", label: t.seconds },
  ];

  return (
    <Section id="countdown" eyebrow={t.eyebrow}>
      <Reveal className="mx-auto max-w-4xl">
        {finalMessage ? (
          <p className="inv-display text-center text-4xl italic sm:text-6xl" role="status">
            {finalMessage}
          </p>
        ) : (
          <dl className="grid grid-cols-4 divide-x divide-inv-line border-y border-inv-line">
            {units.map(({ key, label }) => (
              <div key={key} className="flex flex-col-reverse items-center gap-3 px-1 py-8 sm:py-12">
                <dt className="inv-eyebrow text-[0.575rem] text-inv-muted sm:text-[0.6875rem]">{label}</dt>
                <dd className="inv-display text-[2.6rem] tabular-nums sm:text-7xl" suppressHydrationWarning>
                  {remaining ? String(remaining[key]).padStart(2, "0") : "··"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Reveal>
    </Section>
  );
}
