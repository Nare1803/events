"use client";

import { getDictionary, LOCALES } from "@/lib/i18n";

export default function InvitationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const en = getDictionary("en").states;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-ivory px-6 py-20 text-center text-espresso">
      <div className="flex max-w-md flex-col gap-8">
        {LOCALES.map((locale) => {
          const t = getDictionary(locale).states;
          return (
            <div key={locale} lang={locale}>
              <h1 className="font-serif text-3xl font-light">{t.errorTitle}</h1>
              <p className="mt-3 text-sm leading-6 text-[#665449]">{t.errorText}</p>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={reset}
        className="min-h-12 border border-espresso px-8 text-[0.6875rem] font-medium uppercase tracking-[0.28em] transition-colors hover:bg-espresso hover:text-ivory"
      >
        {en.retry}
      </button>
    </main>
  );
}
