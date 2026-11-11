"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type Ref } from "react";
import type { Dictionary } from "@/lib/i18n";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/locales";
import { filmStyle } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import type { MusicView } from "@/types/invitation";
import { MusicPlayer, type MusicHandle } from "../music-player";

type Props = {
  locales: Locale[];
  current: Locale;
  allowSwitch: boolean;
  label: string;
  music: MusicView | null;
  musicRef: Ref<MusicHandle>;
  musicT: Dictionary["music"];
  /** True while the leader covers the page. */
  intro: boolean;
};

/**
 * Հայ · Eng · Рус pill (44px buttons) and a 48px round music button, fixed 12px
 * from the top and 14px from the right — 28px on the intro and the closing,
 * clear of the sprocket edges. Dark over darkness, light over paper.
 */
export function FilmControls({ locales, current, allowSwitch, label, music, musicRef, musicT, intro }: Props) {
  const search = useSearchParams();
  const [under, setUnder] = useState<{ dark: boolean; edge: boolean }>({ dark: true, edge: false });

  // Watch which screen sits under the controls (the top 8% of the viewport).
  useEffect(() => {
    const screens = [...document.querySelectorAll("[data-rf-dark]")];
    if (screens.length === 0 || !("IntersectionObserver" in window)) return;
    const hits = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) hits.set(entry.target, entry.isIntersecting);
        const active = screens.filter((s) => hits.get(s));
        setUnder({ dark: active.length > 0, edge: active.some((s) => s.getAttribute("data-rf-dark") === "edge") });
      },
      { rootMargin: "0px 0px -92% 0px" },
    );
    screens.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const dark = intro || under.dark;
  const edge = intro || under.edge;
  const hrefFor = (locale: Locale) => {
    const params = new URLSearchParams(search.toString());
    params.set("lang", locale);
    return `?${params.toString()}`;
  };

  if (!allowSwitch && !music) return null;

  return (
    <div
      className={cn(
        "rf-controls fixed top-[calc(max(12px,env(safe-area-inset-top))+var(--inv-banner-h,0px))] z-[60] flex items-center gap-2",
        dark ? "rf-dark" : "rf-light",
        edge ? "right-7" : "right-3.5",
      )}
      style={filmStyle()}
    >
      {allowSwitch && (
        <nav aria-label={label} className="rf-pill">
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
              className={cn("rf-pill-item", locale === current && "is-on")}
            >
              {LOCALE_LABELS[locale].tag}
            </Link>
          ))}
        </nav>
      )}
      {music && <MusicPlayer ref={musicRef} music={music} t={musicT} fadeInMs={1500} className="rf-round" />}
    </div>
  );
}
