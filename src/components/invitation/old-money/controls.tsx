"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type Ref } from "react";
import type { Dictionary } from "@/lib/i18n";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/locales";
import { oldMoneyStyle } from "@/lib/themes";
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
  /** True while the night intro covers the page. */
  intro: boolean;
};

/**
 * HY · EN · RU pill and a 44px round music button, fixed 26px from the top
 * right. Dark over the night intro and the closing screen, light elsewhere.
 */
export function OldMoneyControls({ locales, current, allowSwitch, label, music, musicRef, musicT, intro }: Props) {
  const search = useSearchParams();
  const [overNight, setOverNight] = useState(false);

  // Switch to the dark version while a night screen (the closing) sits under the controls.
  useEffect(() => {
    const night = document.querySelector("[data-om-dark]");
    if (!night || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setOverNight(entry.isIntersecting), { rootMargin: "0px 0px -88% 0px" });
    observer.observe(night);
    return () => observer.disconnect();
  }, []);

  const dark = intro || overNight;
  const hrefFor = (locale: Locale) => {
    const params = new URLSearchParams(search.toString());
    params.set("lang", locale);
    return `?${params.toString()}`;
  };

  if (!allowSwitch && !music) return null;

  return (
    <div
      className={cn("om-controls fixed right-[26px] top-[max(26px,env(safe-area-inset-top))] z-[60] flex items-center gap-2", dark && "is-dark")}
      style={oldMoneyStyle(dark ? "dark" : "light")}
    >
      {allowSwitch && (
        <nav aria-label={label} className="om-pill">
          {/* Always HY · EN · RU, whatever order the couple enabled them in. */}
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
              className={cn("om-pill-item", locale === current && "is-on")}
            >
              {locale.toUpperCase()}
            </Link>
          ))}
        </nav>
      )}
      {music && <MusicPlayer ref={musicRef} music={music} visible t={musicT} appearance="round" className="om-round" />}
    </div>
  );
}
