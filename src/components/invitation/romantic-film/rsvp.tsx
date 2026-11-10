"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils/cn";
import { useRsvpForm, type RsvpFormProps } from "../rsvp-form";
import { Divider } from "./ornaments";

type Props = RsvpFormProps & {
  film: Dictionary["film"];
  /** "RSVP is closed" */
  closedTitle: string;
  /** Reply-by date as it reads after "Kindly reply by"; null without a deadline. */
  deadline: string | null;
  /** "Anna & David", for the message placeholder. */
  names: string;
  /** Accessible names for the − / + guest buttons. */
  stepLabels: { fewer: string; more: string };
  /** "Full name" placeholder for companion fields. */
  fullName: string;
};

const splitNames = (value: string) => value.split(/\s*[,;\n]\s*/).filter(Boolean);

/** The torn edge under a stub once the form part is gone. */
function TornEdge() {
  return <div className="rf-ticket-part h-4" aria-hidden="true" />;
}

/**
 * The RSVP as an admission ticket on darkness: a stub with the guest's name
 * and the reply-by date, a perforation, then the form. After sending only the
 * stub remains. State, validation and the API call are shared with every
 * other template through useRsvpForm.
 */
export function FilmRsvp(props: Props) {
  const { guest, existing, settings, t, film, closedTitle, deadline, names, stepLabels, fullName } = props;
  const {
    values,
    set,
    errors,
    attending,
    maxGuests,
    fieldId,
    errorId,
    describedBy,
    confirmation,
    editing,
    setEditing,
    confirmationRef,
    justSubmitted,
    copied,
    copy,
    rememberedEntry,
    submitting,
    onSubmit,
    formError,
  } = useRsvpForm(props);

  // One field per companion; stored joined, as the shared form stores them.
  const [companions, setCompanions] = useState<string[]>(() => splitNames(values.companionNames));
  const companionCount = Math.max(0, values.guestCount - 1);
  const saveCompanions = (list: string[], count: number) => {
    setCompanions(list);
    set(
      "companionNames",
      list
        .slice(0, count)
        .map((name) => name.trim())
        .filter(Boolean)
        .join(", "),
    );
  };
  const setGuestCount = (count: number) => {
    set("guestCount", count);
    saveCompanions(companions, count - 1);
  };

  const error = (name: string) =>
    errors[name] ? (
      <p id={errorId(name)} role="alert" className="rf-error mt-2">
        {errors[name]}
      </p>
    ) : null;

  const field = (name: string, label: string, input: ReactNode) => (
    <div>
      <label htmlFor={fieldId(name)} className="rf-field-label block">
        {label}
      </label>
      {input}
      {error(name)}
    </div>
  );

  const option = (group: string, value: string, checked: boolean, label: string, onChange: () => void) => (
    <label key={value} className={cn("rf-option", checked && "is-on")}>
      <input type="radio" name={group} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );

  const stub = (children: ReactNode, perforated = true) => (
    <div className={cn("rf-ticket-part px-6 pb-6 pt-6", perforated && "rf-perf")}>
      <p className="rf-admission">{film.admission}</p>
      {children}
    </div>
  );

  // --- Thank you: only the stub remains -----------------------------------------
  if (confirmation && !editing) {
    const accepted = confirmation.attendance === "ATTENDING";
    return (
      <div className="rf-settle" role="status">
        {stub(
          <>
            <h3 ref={confirmationRef} tabIndex={-1} className="rf-ticket-title mt-2 outline-none">
              {interpolate(t.thanksTitle, { name: confirmation.name.split(" ")[0] })}
            </h3>
            <p className="rf-small mt-2 text-rf-soft">{accepted ? t.thanksAttending : t.thanksDeclined}</p>
            {existing && !justSubmitted && <p className="rf-xs mt-1 text-rf-soft">{interpolate(t.respondedOn, { date: existing.submittedLabel })}</p>}
            <Divider width={126} className="mt-5" />

            {confirmation.personalUrl && (
              <div className="mt-6">
                <p className="rf-xs text-rf-soft">{t.personalLink}</p>
                <p className="rf-xs mt-1 break-all">{confirmation.personalUrl}</p>
                <button type="button" onClick={() => copy(confirmation.personalUrl!)} className="rf-button rf-button-ghost mt-3">
                  {copied ? t.copied : t.copyLink}
                </button>
              </div>
            )}

            {settings.rsvpOpen &&
              (guest || !confirmation.personalUrl) &&
              (settings.allowUpdates ? (
                <button type="button" onClick={() => setEditing(true)} className="rf-button rf-button-ghost mt-6">
                  {t.changeResponse}
                </button>
              ) : (
                <p className="rf-xs mt-5 text-rf-soft">{t.locked}</p>
              ))}
          </>,
        )}
        <TornEdge />
      </div>
    );
  }

  // --- Closed / personal link only ----------------------------------------------
  if (!settings.rsvpOpen) {
    return (
      <div role="status">
        {stub(
          <>
            <p className="rf-ticket-title mt-2">{closedTitle}</p>
            <Divider width={126} className="mt-5" />
          </>,
        )}
        <TornEdge />
      </div>
    );
  }
  if (!guest && !settings.openRsvp) {
    return (
      <div>
        {stub(<p className="rf-small mt-3">{t.personalOnly}</p>)}
        <TornEdge />
      </div>
    );
  }

  // --- The full ticket ------------------------------------------------------------
  const countLabelId = fieldId("guestCount-label");
  const countHintId = fieldId("guestCount-hint");

  return (
    <div>
      {stub(
        <>
          {/* The ticket is made out to the guest; on the general link it carries the hosts' names. */}
          {guest ? <p className="rf-ticket-name mt-2">{guest.name}</p> : <p className="rf-ticket-title mt-2">{names}</p>}
          {deadline && <p className="rf-reply-by mt-2">{interpolate(t.deadline, { date: deadline })}</p>}
        </>,
      )}

      <form onSubmit={onSubmit} noValidate className="rf-ticket-part px-6 pb-8 pt-7" aria-busy={submitting}>
        {rememberedEntry?.url && (
          <p className="mb-6 border border-rf-hairline px-4 py-3 text-center">
            {rememberedEntry.name && <span className="rf-item-title block">{rememberedEntry.name}</span>}
            <a href={rememberedEntry.url} className="rf-link">
              {t.changeResponse}
            </a>
          </p>
        )}

        {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor={fieldId("website")}>Website</label>
          <input id={fieldId("website")} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        <div className="flex flex-col gap-4">
          {field(
            "name",
            t.name,
            <input
              id={fieldId("name")}
              className="rf-input"
              autoComplete="name"
              required
              maxLength={120}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={describedBy("name")}
            />,
          )}

          <fieldset aria-describedby={describedBy("attendance")}>
            <legend className="rf-field-label pb-2">{t.title}</legend>
            <div className="grid grid-cols-2 gap-2" id={fieldId("attendance")} tabIndex={-1}>
              {option("attendance", "ATTENDING", values.attendance === "ATTENDING", film.attend, () => set("attendance", "ATTENDING"))}
              {option("attendance", "DECLINED", values.attendance === "DECLINED", film.decline, () => set("attendance", "DECLINED"))}
            </div>
            {error("attendance")}
          </fieldset>

          {attending && (
            <>
              {settings.askGuestCount && maxGuests > 1 && (
                <div>
                  <p id={countLabelId} className="rf-field-label">
                    {t.guestCount}
                  </p>
                  <div
                    role="group"
                    aria-labelledby={countLabelId}
                    aria-describedby={[countHintId, errors.guestCount ? errorId("guestCount") : null].filter(Boolean).join(" ")}
                    className="rf-stepper"
                  >
                    <button
                      type="button"
                      className="rf-step"
                      onClick={() => setGuestCount(Math.max(1, values.guestCount - 1))}
                      disabled={values.guestCount <= 1}
                      aria-label={stepLabels.fewer}
                    >
                      <span aria-hidden="true">−</span>
                    </button>
                    <output id={fieldId("guestCount")} tabIndex={-1} aria-live="polite" className="rf-step-value">
                      {values.guestCount}
                    </output>
                    <button
                      type="button"
                      className="rf-step"
                      onClick={() => setGuestCount(Math.min(maxGuests, values.guestCount + 1))}
                      disabled={values.guestCount >= maxGuests}
                      aria-label={stepLabels.more}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                  <p id={countHintId} className="rf-xs mt-2 text-rf-soft">
                    {interpolate(t.guestCountHint, { max: maxGuests })}
                  </p>
                  {error("guestCount")}
                </div>
              )}

              {/* One companion field for each guest beyond the first. */}
              {settings.askCompanions &&
                companionCount > 0 &&
                (companionCount === 1 ? (
                  field(
                    "companion-0",
                    film.companion,
                    <input
                      id={fieldId("companion-0")}
                      className="rf-input"
                      maxLength={120}
                      placeholder={fullName}
                      value={companions[0] ?? ""}
                      onChange={(e) => saveCompanions([e.target.value, ...companions.slice(1)], companionCount)}
                    />,
                  )
                ) : (
                  <fieldset>
                    <legend className="rf-field-label pb-2">{t.companions}</legend>
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: companionCount }, (_, i) => (
                        <input
                          key={i}
                          id={fieldId(`companion-${i}`)}
                          className="rf-input mt-0"
                          maxLength={120}
                          placeholder={fullName}
                          aria-label={`${film.companion} ${i + 1}`}
                          value={companions[i] ?? ""}
                          onChange={(e) => {
                            const next = [...companions];
                            next[i] = e.target.value;
                            saveCompanions(next, companionCount);
                          }}
                        />
                      ))}
                    </div>
                  </fieldset>
                ))}

              {settings.askTransportation && (
                <fieldset>
                  <legend className="rf-field-label pb-2">{film.transport}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {option("transportationNeeded", "yes", values.transportationNeeded === "yes", t.yes, () => set("transportationNeeded", "yes"))}
                    {option("transportationNeeded", "no", values.transportationNeeded === "no", t.no, () => set("transportationNeeded", "no"))}
                  </div>
                </fieldset>
              )}

              {settings.askDietary &&
                field(
                  "dietaryRestrictions",
                  film.dietary,
                  <input
                    id={fieldId("dietaryRestrictions")}
                    className="rf-input"
                    maxLength={500}
                    placeholder={film.dietaryPlaceholder}
                    value={values.dietaryRestrictions}
                    onChange={(e) => set("dietaryRestrictions", e.target.value)}
                  />,
                )}
            </>
          )}

          {settings.askPhone &&
            field(
              "phone",
              t.phone,
              <input
                id={fieldId("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="rf-input"
                maxLength={32}
                placeholder="+374"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={describedBy("phone")}
              />,
            )}

          {settings.askMessage &&
            field(
              "message",
              t.message,
              <textarea
                id={fieldId("message")}
                className="rf-input min-h-[5.75rem] resize-y"
                maxLength={1500}
                rows={3}
                placeholder={interpolate(film.messagePlaceholder, { names })}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
              />,
            )}
        </div>

        <div aria-live="polite">{formError && <p className="rf-error mt-5 text-center">{formError}</p>}</div>

        <button type="submit" className="rf-button rf-button-lg mt-6 w-full" disabled={submitting}>
          {submitting ? t.submitting : existing || confirmation ? t.update : film.send}
        </button>
      </form>
    </div>
  );
}
