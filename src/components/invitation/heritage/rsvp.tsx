"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import { HERITAGE } from "@/lib/themes";
import { cn } from "@/lib/utils/cn";
import { useRsvpForm, type RsvpFormProps } from "../rsvp-form";
import { Rosette } from "./ornaments";
import { Tr } from "./primitives";

type Second = { locale: Locale; t: Dictionary["rsvp"]; h: Dictionary["heritage"]; respondedOn: string | null } | null;
type Props = RsvpFormProps & { h: Dictionary["heritage"]; second: Second };

/** "Armenian · Translation" on one line, e.g. a field label. */
function Pair({ hy, tr, lang }: { hy: string; tr?: string | null; lang?: string }) {
  return (
    <>
      <span>{hy}</span>
      {tr && lang && tr !== hy && (
        <>
          <span aria-hidden="true" className="her-sep">
            {" · "}
          </span>
          <span lang={lang} className="her-tr inline">
            {tr}
          </span>
        </>
      )}
    </>
  );
}

function FieldError({ id, message, translation, lang }: { id: string; message?: string; translation?: string | null; lang?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm leading-6 text-her-red">
      {message}
      <Tr text={translation} primary={message} lang={lang} className="text-[0.9375rem]" />
    </p>
  );
}

/**
 * Heritage layout of the RSVP form: underlined gold fields, attend / decline as
 * two large toggles, a −/+ guest counter and a pomegranate submit button. State,
 * validation and the API call are shared with the default form (useRsvpForm).
 */
export function HeritageRsvp(props: Props) {
  const { guest, existing, settings, t, h, second } = props;
  const f = useRsvpForm(props);
  const { values, set, errors, attending, maxGuests, fieldId, errorId, describedBy } = f;
  const lang = second?.locale;
  const t2 = second?.t;

  // Messages come from the shared logic in Armenian; pair each with its translation.
  const translate = (message: string | null | undefined): string | null => {
    if (!message || !t2) return null;
    const pairs: [string, string][] = [
      [t.errors.required, t2.errors.required],
      [t.errors.attendance, t2.errors.attendance],
      [t.errors.phone, t2.errors.phone],
      [t.errors.generic, t2.errors.generic],
      [t.errors.network, t2.errors.network],
      [t.errors.rateLimited, t2.errors.rateLimited],
      [interpolate(t.errors.guestCount, { max: maxGuests }), interpolate(t2.errors.guestCount, { max: maxGuests })],
      [t.closed, t2.closed],
      [t.locked, t2.locked],
      [t.personalOnly, t2.personalOnly],
      [t.previewNotice, t2.previewNotice],
    ];
    return pairs.find(([hy]) => hy === message)?.[1] ?? null;
  };

  const error = (name: string) => (
    <FieldError id={errorId(name)} message={errors[name]} translation={translate(errors[name])} lang={lang} />
  );

  // --- Thank-you state --------------------------------------------------
  if (f.confirmation && !f.editing) {
    const { confirmation } = f;
    const firstName = confirmation.name.split(" ")[0];
    const attended = confirmation.attendance === "ATTENDING";
    return (
      <div className="text-center" role="status">
        <Rosette size={30} color={HERITAGE.pomegranate} className="mx-auto" />
        <h3 ref={f.confirmationRef} tabIndex={-1} className="her-title mt-6 outline-none">
          {interpolate(t.thanksTitle, { name: firstName })}
          {t2 && <Tr text={interpolate(t2.thanksTitle, { name: firstName })} lang={lang} className="mt-1 text-[1.3125rem]" />}
        </h3>
        <p className="her-body mt-5">{attended ? t.thanksAttending : t.thanksDeclined}</p>
        <Tr as="p" text={t2 ? (attended ? t2.thanksAttending : t2.thanksDeclined) : null} lang={lang} className="her-body-tr mt-2" />
        {existing && !f.justSubmitted && (
          <p className="mt-4 text-sm leading-6 text-inv-muted">
            {interpolate(t.respondedOn, { date: existing.submittedLabel })}
            {t2 && second?.respondedOn && <Tr text={interpolate(t2.respondedOn, { date: second.respondedOn })} lang={lang} className="text-[0.9375rem]" />}
          </p>
        )}

        {confirmation.personalUrl && (
          <div className="mt-9 border-t border-inv-line pt-7">
            <p className="text-sm leading-6 text-inv-muted">
              <Pair hy={t.personalLink} tr={t2?.personalLink} lang={lang} />
            </p>
            <p className="mt-3 break-all text-[0.9375rem]">{confirmation.personalUrl}</p>
            <button type="button" onClick={() => f.copy(confirmation.personalUrl!)} className="her-button-outline mt-4">
              {f.copied ? <Pair hy={t.copied} tr={t2?.copied} lang={lang} /> : <Pair hy={t.copyLink} tr={t2?.copyLink} lang={lang} />}
            </button>
          </div>
        )}

        {settings.rsvpOpen &&
          (guest || !confirmation.personalUrl) &&
          (settings.allowUpdates ? (
            <button type="button" onClick={() => f.setEditing(true)} className="her-button-outline mt-9">
              <Pair hy={t.changeResponse} tr={t2?.changeResponse} lang={lang} />
            </button>
          ) : (
            <p className="mt-8 text-sm leading-6 text-inv-muted">
              {t.locked}
              <Tr text={t2?.locked} lang={lang} />
            </p>
          ))}
      </div>
    );
  }

  if (!settings.rsvpOpen || (!guest && !settings.openRsvp)) {
    const message = settings.rsvpOpen ? t.personalOnly : t.closed;
    return (
      <p className="her-body text-inv-muted">
        {message}
        <Tr text={translate(message)} lang={lang} className="her-body-tr mt-2" />
      </p>
    );
  }

  // --- Form ---------------------------------------------------------------
  const label = (name: string, hy: string, tr?: string | null, optional = false): ReactNode => (
    <label htmlFor={fieldId(name)} className="block text-[0.9375rem] leading-6">
      <Pair hy={hy} tr={tr} lang={lang} />
      {optional && <span className="ml-2 whitespace-nowrap text-xs text-inv-muted">({t.optional})</span>}
    </label>
  );

  const countHintId = fieldId("guestCount-hint");
  const countLabelId = fieldId("guestCount-label");

  return (
    <form onSubmit={f.onSubmit} noValidate className="text-left" aria-busy={f.submitting}>
      {f.rememberedEntry?.url && (
        <p className="mb-9 border border-inv-line px-5 py-4 text-center text-sm leading-6 text-inv-muted">
          {f.rememberedEntry.name && <span className="block text-base text-inv-text">{f.rememberedEntry.name}</span>}
          <a href={f.rememberedEntry.url} className="inv-link text-her-red">
            <Pair hy={t.changeResponse} tr={t2?.changeResponse} lang={lang} />
          </a>
        </p>
      )}

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input id={fieldId("website")} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="flex flex-col gap-9">
        <div>
          {label("name", h.fullName, second?.h.fullName)}
          <input
            id={fieldId("name")}
            className="her-field"
            autoComplete="name"
            required
            maxLength={120}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
          />
          {error("name")}
        </div>

        <fieldset aria-describedby={describedBy("attendance")}>
          <legend className="sr-only">
            {t.attendance}
            {t2 && <span lang={lang}> {t2.attendance}</span>}
          </legend>
          <div className="grid gap-3" id={fieldId("attendance")} tabIndex={-1}>
            {(["ATTENDING", "DECLINED"] as const).map((option) => {
              const checked = values.attendance === option;
              const hy = option === "ATTENDING" ? t.attending : h.declining;
              const tr = option === "ATTENDING" ? t2?.attending : second?.h.declining;
              return (
                <label key={option} className={cn("her-toggle", checked && "is-on")}>
                  <input type="radio" name="attendance" value={option} checked={checked} onChange={() => set("attendance", option)} className="sr-only" />
                  <span className="block text-[1.0625rem] leading-6">{hy}</span>
                  <Tr text={tr} primary={hy} lang={lang} className="her-toggle-tr text-base leading-6" />
                </label>
              );
            })}
          </div>
          {error("attendance")}
        </fieldset>

        {attending && (
          <>
            {settings.askGuestCount && maxGuests > 1 && (
              <div>
                <p id={countLabelId} className="text-[0.9375rem] leading-6">
                  <Pair hy={t.guestCount} tr={t2?.guestCount} lang={lang} />
                </p>
                <div
                  role="group"
                  aria-labelledby={countLabelId}
                  aria-describedby={[countHintId, errors.guestCount ? errorId("guestCount") : null].filter(Boolean).join(" ")}
                  className="mt-2 flex items-center justify-between border-b border-her-gold pb-2"
                >
                  <button
                    type="button"
                    className="her-step"
                    onClick={() => set("guestCount", Math.max(1, values.guestCount - 1))}
                    disabled={values.guestCount <= 1}
                    aria-label={second ? `${h.fewerGuests} · ${second.h.fewerGuests}` : h.fewerGuests}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <output id={fieldId("guestCount")} tabIndex={-1} aria-live="polite" className="inv-display text-[2.25rem] leading-none tabular-nums outline-none">
                    {values.guestCount}
                  </output>
                  <button
                    type="button"
                    className="her-step"
                    onClick={() => set("guestCount", Math.min(maxGuests, values.guestCount + 1))}
                    disabled={values.guestCount >= maxGuests}
                    aria-label={second ? `${h.moreGuests} · ${second.h.moreGuests}` : h.moreGuests}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
                <p id={countHintId} className="mt-2 text-sm leading-6 text-inv-muted">
                  <Pair
                    hy={interpolate(t.guestCountHint, { max: maxGuests })}
                    tr={t2 ? interpolate(t2.guestCountHint, { max: maxGuests }) : null}
                    lang={lang}
                  />
                </p>
                {error("guestCount")}
              </div>
            )}

            {settings.askCompanions && values.guestCount > 1 && (
              <div>
                {label("companionNames", t.companions, t2?.companions)}
                <input
                  id={fieldId("companionNames")}
                  className="her-field"
                  maxLength={500}
                  value={values.companionNames}
                  onChange={(e) => set("companionNames", e.target.value)}
                  aria-describedby={fieldId("companions-hint")}
                />
                <p id={fieldId("companions-hint")} className="mt-2 text-sm leading-6 text-inv-muted">
                  <Pair hy={t.companionsHint} tr={t2?.companionsHint} lang={lang} />
                </p>
              </div>
            )}

            {settings.askTransportation && (
              <fieldset>
                <legend className="text-[0.9375rem] leading-6">
                  <Pair hy={t.transport} tr={t2?.transport} lang={lang} />
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(["yes", "no"] as const).map((option) => {
                    const checked = values.transportationNeeded === option;
                    const hy = option === "yes" ? t.yes : t.no;
                    return (
                      <label key={option} className={cn("her-toggle her-toggle-sm", checked && "is-on")}>
                        <input
                          type="radio"
                          name="transportationNeeded"
                          value={option}
                          checked={checked}
                          onChange={() => set("transportationNeeded", option)}
                          className="sr-only"
                        />
                        <Pair hy={hy} tr={t2 ? (option === "yes" ? t2.yes : t2.no) : null} lang={lang} />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {settings.askDietary && (
              <div>
                {label("dietaryRestrictions", t.dietary, t2?.dietary, true)}
                <input
                  id={fieldId("dietaryRestrictions")}
                  className="her-field"
                  maxLength={500}
                  value={values.dietaryRestrictions}
                  onChange={(e) => set("dietaryRestrictions", e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {settings.askPhone && (
          <div>
            {label("phone", t.phone, t2?.phone, true)}
            <input
              id={fieldId("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="her-field"
              maxLength={32}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby={describedBy("phone")}
            />
            {error("phone")}
          </div>
        )}

        {settings.askMessage && (
          <div>
            {label("message", t.message, t2?.message, true)}
            <textarea
              id={fieldId("message")}
              className="her-field min-h-28 resize-y"
              maxLength={1500}
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>
        )}
      </div>

      <div aria-live="polite" className="min-h-6">
        {f.formError && (
          <p className="mt-8 text-center text-sm leading-6 text-her-red">
            {f.formError}
            <Tr text={translate(f.formError)} primary={f.formError} lang={lang} className="text-[0.9375rem]" />
          </p>
        )}
      </div>

      <button type="submit" className="her-button mt-8 w-full" disabled={f.submitting}>
        {f.submitting ? (
          <Pair hy={t.submitting} tr={t2?.submitting} lang={lang} />
        ) : existing || f.confirmation ? (
          <Pair hy={t.update} tr={t2?.update} lang={lang} />
        ) : (
          <Pair hy={h.send} tr={second?.h.send} lang={lang} />
        )}
      </button>
    </form>
  );
}
