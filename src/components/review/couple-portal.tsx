import Link from "next/link";
import { brand, siteUrl } from "@/config/brand";
import { db } from "@/lib/db";
import { interpolate, type Dictionary } from "@/lib/i18n";
import { formatLongDate } from "@/lib/utils/dates";
import { CopyLink } from "./copy-link";

type PortalProps = {
  token: string;
  event: { id: string; slug: string; timezone: string };
  title: string;
  t: Dictionary["review"];
  locale: "hy" | "en" | "ru";
};

/**
 * The couple's page after publication: their final link, a personal link for
 * every guest and live RSVP results. Read-only — ORÉ keeps editing in the studio.
 */
export async function CouplePortal({ token, event, title, t, locale }: PortalProps) {
  const guests = await db.guest.findMany({ where: { eventId: event.id }, include: { rsvp: true }, orderBy: { name: "asc" } });
  const publicUrl = `${siteUrl()}/${event.slug}`;
  const attending = guests.filter((g) => g.rsvp?.attendance === "ATTENDING");
  const declined = guests.filter((g) => g.rsvp?.attendance === "DECLINED");
  const headcount = attending.reduce((sum, g) => sum + (g.rsvp?.guestCount ?? 0), 0);
  const messages = guests.filter((g) => g.rsvp?.message).map((g) => ({ id: g.id, name: g.rsvp!.respondentName, message: g.rsvp!.message! }));

  const stats = [
    { label: t.invited, value: guests.length },
    { label: t.responded, value: attending.length + declined.length },
    { label: t.attending, value: attending.length },
    { label: t.declined, value: declined.length },
    { label: t.awaiting, value: guests.length - attending.length - declined.length },
  ];

  return (
    <main className="min-h-dvh bg-ivory text-espresso" lang={locale}>
      <header className="border-b border-espresso/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl tracking-[0.24em]">{brand.name}</span>
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.28em] text-[#6F5D53]">{t.privatePage}</span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-24">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.32em] text-[#6F5D53]">{t.liveTitle}</p>
        <h1 className="mt-6 font-serif text-5xl font-light sm:text-7xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-lg leading-8 text-[#665449]">{t.liveText}</p>

        <div className="mx-auto mt-10 max-w-xl border-y border-espresso/15 py-6">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.28em] text-[#665449]">{t.generalLink}</p>
          <p className="mt-3 break-all font-serif text-2xl">{publicUrl.replace(/^https?:\/\//, "")}</p>
          <div className="mt-2 flex justify-center gap-8">
            <CopyLink value={publicUrl} label={t.copy} copiedLabel={t.copied} className="inv-link" />
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inv-link">
              {t.viewInvitation}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="guests-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="guests-title" className="font-serif text-4xl font-light">
            {t.guestsTitle}
          </h2>
          {guests.length > 0 && (
            <a href={`/review/${token}/export`} className="inv-link">
              {t.downloadCsv}
            </a>
          )}
        </div>

        <dl className="mt-8 grid grid-cols-2 border-y border-espresso/15 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center gap-1 py-6">
              <dt className="text-[0.625rem] font-medium uppercase tracking-[0.24em] text-[#665449]">{s.label}</dt>
              <dd className="font-serif text-4xl tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        {headcount > 0 && <p className="mt-4 text-center text-sm text-[#665449]">{interpolate(t.people, { count: headcount })}</p>}

        {guests.length === 0 ? (
          <p className="mt-12 text-center text-[#665449]">{t.noGuests}</p>
        ) : (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[0.625rem] uppercase tracking-[0.2em] text-[#665449]">
                <tr className="border-b border-espresso/15">
                  <th scope="col" className="py-3 pr-4 font-medium">{t.guest}</th>
                  <th scope="col" className="py-3 pr-4 font-medium">{t.link}</th>
                  <th scope="col" className="py-3 pr-4 font-medium">{t.response}</th>
                  <th scope="col" className="py-3 font-medium">{t.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/10">
                {guests.map((g) => {
                  const url = `${publicUrl}/${g.slug}`;
                  const phone = g.phone?.replace(/[^\d]/g, "") ?? "";
                  return (
                    <tr key={g.id} className="align-top">
                      <td className="py-4 pr-4 font-serif text-lg">{g.name}</td>
                      <td className="py-4 pr-4">
                        <span className="flex flex-wrap items-center gap-x-4">
                          <CopyLink value={url} label={t.copy} copiedLabel={t.copied} className="text-xs font-medium uppercase tracking-[0.18em] underline underline-offset-4" />
                          <a
                            href={`https://wa.me/${phone}?text=${encodeURIComponent(`${title}\n${url}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium uppercase tracking-[0.18em] underline underline-offset-4"
                          >
                            WhatsApp
                          </a>
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        {g.rsvp ? (g.rsvp.attendance === "ATTENDING" ? `${t.attending} · ${g.rsvp.guestCount}` : t.declined) : <span className="text-[#665449]">{t.awaiting}</span>}
                      </td>
                      <td className="py-4 text-[#665449]">
                        {[g.rsvp?.companionNames, g.rsvp?.dietaryRestrictions].filter(Boolean).join(" · ") || "—"}
                        {g.rsvp && <span className="block text-xs">{formatLongDate(g.rsvp.updatedAt, event.timezone, locale)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-20">
            <h2 className="text-center font-serif text-4xl font-light">{t.messagesTitle}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {messages.map((m) => (
                <figure key={m.id} className="border border-espresso/10 bg-white/40 p-6">
                  <blockquote className="font-serif text-xl italic leading-relaxed">“{m.message}”</blockquote>
                  <figcaption className="mt-4 text-[0.625rem] font-medium uppercase tracking-[0.24em] text-[#665449]">{m.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-espresso/10 py-10 text-center text-sm text-[#665449]">
        {interpolate(t.help, { email: brand.supportEmail })}
        <p className="mt-4">
          <Link href="/" className="font-serif text-lg tracking-[0.24em] text-espresso">
            {brand.name}
          </Link>
        </p>
      </footer>
    </main>
  );
}
