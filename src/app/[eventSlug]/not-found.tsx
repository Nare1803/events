import { getDictionary, LOCALES } from "@/lib/i18n";
import { brand } from "@/config/brand";

/** Guest-facing 404 — shown in all three languages because the event locale is unknown. */
export default function InvitationNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-12 bg-ivory px-6 py-20 text-center text-espresso">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-mocha">{brand.name}</p>
      <div className="flex max-w-md flex-col gap-10">
        {LOCALES.map((locale) => {
          const t = getDictionary(locale).states;
          return (
            <div key={locale} lang={locale}>
              <h1 className="font-serif text-3xl font-light">{t.notFoundTitle}</h1>
              <p className="mt-3 text-sm leading-6 text-[#665449]">{t.notFoundText}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
