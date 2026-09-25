"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils/cn";

type LanguageSwitcherProps = { locales: Locale[]; current: Locale; label: string };

/**
 * Switches language with a soft navigation (?lang=…): the server re-renders the
 * copy while the client shell — intro state and playing music — stays mounted.
 */
export function LanguageSwitcher({ locales, current, label }: LanguageSwitcherProps) {
  const search = useSearchParams();
  // Keep other parameters (e.g. studio preview flags) when switching language.
  const hrefFor = (locale: Locale) => {
    const params = new URLSearchParams(search.toString());
    params.set("lang", locale);
    return `?${params.toString()}`;
  };
  return (
    <nav
      aria-label={label}
      className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex items-center rounded-full border border-inv-line bg-inv-bg/85 px-1 text-inv-text backdrop-blur-md sm:right-6"
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={hrefFor(locale)}
          replace
          scroll={false}
          lang={locale}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={cn(
            "flex h-10 min-w-11 items-center justify-center px-2.5 text-[0.625rem] font-medium tracking-[0.18em] transition-opacity",
            locale === current ? "opacity-100" : "opacity-50 hover:opacity-100",
          )}
        >
          {LOCALE_LABELS[locale].short}
        </Link>
      ))}
    </nav>
  );
}
