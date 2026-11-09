"use client";

import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils/cn";
import { useRsvpForm, type RsvpFormProps } from "../rsvp-form";
import { LaurelSprig } from "./ornaments";

type Props = RsvpFormProps & {
  om: Dictionary["oldMoney"];
  /** "Send reply" */
  sendLabel: string;
  /** When replies closed, e.g. "15 June 2027" (shown once RSVP is closed). */
  closedOn: string | null;
  /** Accessible names for the − / + guest buttons. */
  stepLabels: { fewer: string; more: string };
};

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden="true" focusable="false">
      <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="square" />
    </svg>
  );
}

/**
 * The reply card: underline-only fields, accept / decline rows with square
 * boxes, a guest stepper capped at the guest's allowance and a navy "Send
 * reply" button. State, validation and the API call are shared with every
 * other template through useRsvpForm.
 */
export function OldMoneyRsvp(props: Props) {
  const { guest, existing, settings, t, om, sendLabel, closedOn, stepLabels } = props;
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

  const error = (name: string) =>
    errors[name] ? (
      <p id={errorId(name)} role="alert" className="om-error mt-2">
        {errors[name]}
      </p>
    ) : null;

  const field = (name: string, label: string, input: ReactNode, extra?: ReactNode) => (
    <div>
      <label htmlFor={fieldId(name)} className="om-label om-label-sm block">
        {label}
      </label>
      {input}
      {extra}
      {error(name)}
    </div>
  );

  // --- Thank-you ------------------------------------------------------------
  if (confirmation && !editing) {
    const accepted = confirmation.attendance === "ATTENDING";
    return (
      <div className="text-center" role="status">
        <LaurelSprig width={104} className="mx-auto" />
        <h3 ref={confirmationRef} tabIndex={-1} className="om-thanks mt-6 outline-none">
          {interpolate(t.thanksTitle, { name: confirmation.name.split(" ")[0] })}
        </h3>
        <p className="om-request mt-3">{accepted ? om.accepts : om.declines}</p>
        <p className="om-body mt-4 text-inv-muted">{accepted ? t.thanksAttending : t.thanksDeclined}</p>
        {existing && !justSubmitted && <p className="om-desc mt-3">{interpolate(t.respondedOn, { date: existing.submittedLabel })}</p>}

        {confirmation.personalUrl && (
          <div className="mt-8 border-t border-om-gold pt-6">
            <p className="om-desc">{t.personalLink}</p>
            <p className="om-text mt-2 break-all text-base">{confirmation.personalUrl}</p>
            <button type="button" onClick={() => copy(confirmation.personalUrl!)} className="om-button om-button-outline mt-4 w-full">
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
        )}

        {settings.rsvpOpen &&
          (guest || !confirmation.personalUrl) &&
          (settings.allowUpdates ? (
            <button type="button" onClick={() => setEditing(true)} className="om-button om-button-outline mt-8 w-full">
              {t.changeResponse}
            </button>
          ) : (
            <p className="om-desc mt-6">{t.locked}</p>
          ))}
      </div>
    );
  }

  // --- Closed / personal link only -----------------------------------------
  if (!settings.rsvpOpen) {
    return (
      <div className="text-center" role="status">
        <p className="om-thanks">{om.closedTitle}</p>
        {closedOn && <p className="om-body mt-3 text-inv-muted">{interpolate(om.closedOn, { date: closedOn })}</p>}
      </div>
    );
  }
  if (!guest && !settings.openRsvp) {
    return <p className="om-body text-center text-inv-muted">{t.personalOnly}</p>;
  }

  // --- Form ---------------------------------------------------------------
  const countLabelId = fieldId("guestCount-label");
  const countHintId = fieldId("guestCount-hint");

  return (
    <form onSubmit={onSubmit} noValidate className="text-left" aria-busy={submitting}>
      {rememberedEntry?.url && (
        <p className="mb-8 border border-om-gold px-5 py-4 text-center">
          {rememberedEntry.name && <span className="om-text block text-lg">{rememberedEntry.name}</span>}
          <a href={rememberedEntry.url} className="om-link">
            {t.changeResponse}
          </a>
        </p>
      )}

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input id={fieldId("website")} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="flex flex-col gap-7">
        {field(
          "name",
          t.name,
          <input
            id={fieldId("name")}
            className="om-field"
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
          <legend className="sr-only">{t.attendance}</legend>
          <div className="flex flex-col gap-1" id={fieldId("attendance")} tabIndex={-1}>
            {(["ATTENDING", "DECLINED"] as const).map((option) => {
              const checked = values.attendance === option;
              return (
                <label key={option} className={cn("om-option", checked && "is-on")}>
                  <input type="radio" name="attendance" value={option} checked={checked} onChange={() => set("attendance", option)} className="sr-only" />
                  <span className="om-box" aria-hidden="true">
                    {checked && <CheckMark />}
                  </span>
                  <span className="om-option-text">{option === "ATTENDING" ? om.accepts : om.declines}</span>
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
                <div
                  role="group"
                  aria-labelledby={countLabelId}
                  aria-describedby={[countHintId, errors.guestCount ? errorId("guestCount") : null].filter(Boolean).join(" ")}
                  className="flex items-center justify-between gap-4 border-b border-om-rule pb-3"
                >
                  <div className="min-w-0">
                    <p id={countLabelId} className="om-label om-label-sm">
                      {t.guestCount}
                    </p>
                    <p id={countHintId} className="om-desc mt-1">
                      {interpolate(t.guestCountHint, { max: maxGuests })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      className="om-step"
                      onClick={() => set("guestCount", Math.max(1, values.guestCount - 1))}
                      disabled={values.guestCount <= 1}
                      aria-label={stepLabels.fewer}
                    >
                      <span aria-hidden="true">−</span>
                    </button>
                    <output id={fieldId("guestCount")} tabIndex={-1} aria-live="polite" className="om-display w-8 text-center text-[1.75rem] tabular-nums outline-none">
                      {values.guestCount}
                    </output>
                    <button
                      type="button"
                      className="om-step"
                      onClick={() => set("guestCount", Math.min(maxGuests, values.guestCount + 1))}
                      disabled={values.guestCount >= maxGuests}
                      aria-label={stepLabels.more}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </div>
                {error("guestCount")}
              </div>
            )}

            {settings.askCompanions &&
              values.guestCount > 1 &&
              field(
                "companionNames",
                t.companions,
                <input
                  id={fieldId("companionNames")}
                  className="om-field"
                  maxLength={500}
                  placeholder={om.companionsPlaceholder}
                  value={values.companionNames}
                  onChange={(e) => set("companionNames", e.target.value)}
                />,
              )}

            {settings.askTransportation && (
              <fieldset>
                <legend className="sr-only">{t.transport}</legend>
                <div className="flex items-center justify-between gap-4">
                <p className="om-text text-[1.125rem] leading-[1.35]" aria-hidden="true">
                  {t.transport}
                </p>
                <div className="flex shrink-0 gap-2">
                  {(["yes", "no"] as const).map((option) => {
                    const checked = values.transportationNeeded === option;
                    return (
                      <label key={option} className={cn("om-choice", checked && "is-on")}>
                        <input
                          type="radio"
                          name="transportationNeeded"
                          value={option}
                          checked={checked}
                          onChange={() => set("transportationNeeded", option)}
                          className="sr-only"
                        />
                        {option === "yes" ? t.yes : t.no}
                      </label>
                    );
                  })}
                </div>
                </div>
              </fieldset>
            )}

            {settings.askDietary &&
              field(
                "dietaryRestrictions",
                t.dietary,
                <input
                  id={fieldId("dietaryRestrictions")}
                  className="om-field"
                  maxLength={500}
                  placeholder={om.dietaryPlaceholder}
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
              className="om-field"
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
              className="om-field min-h-24 resize-y"
              maxLength={1500}
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
            />,
          )}
      </div>

      <div aria-live="polite" className="min-h-6">
        {formError && <p className="om-error mt-6 text-center">{formError}</p>}
      </div>

      <button type="submit" className="om-button om-button-primary mt-6 w-full" disabled={submitting}>
        {submitting ? t.submitting : existing || confirmation ? t.update : sendLabel}
      </button>
    </form>
  );
}
