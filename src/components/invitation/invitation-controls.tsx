"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Ref } from "react";
import type { Dictionary } from "@/lib/i18n";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils/cn";
import type { MusicView } from "@/types/invitation";
import { MusicPlayer, type MusicHandle } from "./music-player";

type Props = {
  locales: Locale[];
  current: Locale;
  allowSwitch: boolean;
  label: string;
  music: MusicView | null;
  musicRef: Ref<MusicHandle>;
  musicT: Dictionary["music"];
};

/**
 * The classic templates' controls (Editorial Nude, Black & Ivory, Modern Garden,
 * Armenian Heritage): Հայ · Eng · Рус and a 48px music button, 12px from the top
 * right on every screen. Old Money and Romantic Film use the same set in their
 * own materials. Languages switch with a soft navigation (?lang=…), so the intro
 * state and playing music stay mounted while the server re-renders the copy.
 */
export function InvitationControls({ locales, current, allowSwitch, label, music, musicRef, musicT }: Props) {
  const search = useSearchParams();
  // Keep other parameters (e.g. studio preview flags) when switching language.
  const hrefFor = (locale: Locale) => {
    const params = new URLSearchParams(search.toString());
    params.set("lang", locale);
    return `?${params.toString()}`;
  };

  if (!allowSwitch && !music) return null;

  return (
    <div className="inv-controls fixed right-3 top-[calc(max(12px,env(safe-area-inset-top))+var(--inv-banner-h,0px))] z-[60] flex items-center gap-2">
      {allowSwitch && (
        <nav aria-label={label} className="inv-pill">
          {/* Always Հայ · Eng · Рус, whatever order the couple enabled them in. */}
          {LOCALES.filter((l) => locales.includes(l)).map((locale) => (
            <Link
              key={locale}
              href={hrefFor(locale)}
              replace
              scroll={false}
              lang={locale}
              hrefLang={locale}
              title={LOCALE_LABELS[locale].native}
              aria-current={locale === current ? "true" : undefined}
              className={cn("inv-pill-item", locale === current && "is-on")}
            >
              {LOCALE_LABELS[locale].tag}
            </Link>
          ))}
        </nav>
      )}
      {music && <MusicPlayer ref={musicRef} music={music} t={musicT} className="inv-round" />}
    </div>
  );
}
