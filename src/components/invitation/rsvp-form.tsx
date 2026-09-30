"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locales";
import type { Attendance } from "@/lib/validation/enums";
import { cn } from "@/lib/utils/cn";
import type { InvitationView, RsvpView } from "@/types/invitation";
import { CheckIcon } from "./icons";

type RsvpFormProps = {
  eventSlug: string;
  locale: Locale;
  guest: InvitationView["guest"];
  existing: RsvpView | null;
  settings: InvitationView["settings"];
  t: Dictionary["rsvp"];
};

type Values = {
  name: string;
  attendance: Attendance | "";
  guestCount: number;
  companionNames: string;
  transportationNeeded: "yes" | "no" | "";
  dietaryRestrictions: string;
  message: string;
  phone: string;
  website: string;
};

type Confirmation = { name: string; attendance: Attendance; personalUrl: string | null };

type ApiResult =
  | { ok: true; guestSlug: string | null; personalUrl: string | null }
  | { ok: false; code: string; fieldErrors?: Record<string, string> };

const storageKey = (eventSlug: string) => `ore:rsvp:${eventSlug}`;

/** Remembers a general-link RSVP on this device so the guest can find their personal link later. */
function useRememberedResponse(eventSlug: string) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      return () => window.removeEventListener("storage", onChange);
    },
    () => {
      try {
        return window.localStorage.getItem(storageKey(eventSlug));
      } catch {
        return null;
      }
    },
    () => null,
  );
}

function initialValues(guest: RsvpFormProps["guest"], existing: RsvpView | null): Values {
  return {
    name: existing?.respondentName ?? guest?.name ?? "",
    attendance: existing?.attendance ?? "",
    guestCount: existing && existing.guestCount > 0 ? existing.guestCount : 1,
    companionNames: existing?.companionNames ?? "",
    transportationNeeded: existing?.transportationNeeded == null ? "" : existing.transportationNeeded ? "yes" : "no",
    dietaryRestrictions: existing?.dietaryRestrictions ?? "",
    message: existing?.message ?? "",
    phone: existing?.phone ?? "",
    website: "",
  };
}

export function RsvpForm({ eventSlug, locale, guest, existing, settings, t }: RsvpFormProps) {
  const formId = useId();
  const [values, setValues] = useState<Values>(() => initialValues(guest, existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(!existing);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(
    existing ? { name: existing.respondentName, attendance: existing.attendance, personalUrl: null } : null,
  );
  const [copied, setCopied] = useState(false);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const remembered = useRememberedResponse(eventSlug);

  const maxGuests = settings.maxGuests;
  const attending = values.attendance === "ATTENDING";

  useEffect(() => {
    if (justSubmitted && !editing) confirmationRef.current?.focus();
  }, [justSubmitted, editing, confirmation]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = t.errors.required;
    if (!values.attendance) next.attendance = t.errors.attendance;
    if (attending && (values.guestCount < 1 || values.guestCount > maxGuests)) {
      next.guestCount = interpolate(t.errors.guestCount, { max: maxGuests });
    }
    if (values.phone.trim() && !/^\+?[\d\s().-]{6,24}$/.test(values.phone.trim())) next.phone = t.errors.phone;
    return next;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return; // guards against double taps
    const found = validate();
    setErrors(found);
    setFormError(null);
    const firstInvalid = Object.keys(found).find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(`${formId}-${firstInvalid}`)?.focus();
      return;
    }

    if (settings.rsvpMode === "preview") {
      // Previews and examples never write real responses.
      setFormError(t.previewNotice);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(eventSlug)}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestSlug: guest?.slug,
          name: values.name,
          attendance: values.attendance,
          guestCount: attending ? (settings.askGuestCount ? values.guestCount : 1) : 0,
          companionNames: attending && settings.askCompanions && values.guestCount > 1 ? values.companionNames : "",
          transportationNeeded:
            attending && settings.askTransportation && values.transportationNeeded
              ? values.transportationNeeded === "yes"
              : null,
          dietaryRestrictions: attending && settings.askDietary ? values.dietaryRestrictions : "",
          message: settings.askMessage ? values.message : "",
          phone: settings.askPhone ? values.phone : "",
          locale,
          website: values.website,
        }),
      });
      const result = (await response.json().catch(() => null)) as ApiResult | null;

      if (!result) throw new Error("Invalid response");
      if (!result.ok) {
        if (result.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const key of Object.keys(result.fieldErrors)) {
            mapped[key] = key === "phone" ? t.errors.phone : key === "guestCount" ? interpolate(t.errors.guestCount, { max: maxGuests }) : t.errors.required;
          }
          setErrors(mapped);
        }
        setFormError(
          result.code === "RATE_LIMITED"
            ? t.errors.rateLimited
            : result.code === "CLOSED"
              ? t.closed
              : result.code === "LOCKED"
                ? t.locked
                : result.code === "PERSONAL_ONLY"
                  ? t.personalOnly
                  : t.errors.generic,
        );
        return;
      }

      if (!guest && result.guestSlug) {
        try {
          window.localStorage.setItem(
            storageKey(eventSlug),
            JSON.stringify({ name: values.name.trim(), url: result.personalUrl }),
          );
        } catch {
          // Storage can be unavailable (private mode) — the link is still shown below.
        }
      }
      setJustSubmitted(true);
      setConfirmation({ name: values.name.trim(), attendance: values.attendance as Attendance, personalUrl: result.personalUrl });
      setEditing(false);
    } catch {
      setFormError(t.errors.network);
    } finally {
      setSubmitting(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  // --- Non-form states --------------------------------------------------
  if (confirmation && !editing) {
    const firstName = confirmation.name.split(" ")[0];
    return (
      <div className="mx-auto max-w-xl text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-inv-line text-inv-accent">
          <CheckIcon size={22} />
        </span>
        <h3 ref={confirmationRef} tabIndex={-1} className="inv-display mt-8 text-4xl italic outline-none sm:text-5xl">
          {interpolate(t.thanksTitle, { name: firstName })}
        </h3>
        <p className="mt-6 leading-8 text-inv-muted">
          {confirmation.attendance === "ATTENDING" ? t.thanksAttending : t.thanksDeclined}
        </p>
        {existing && !justSubmitted && (
          <p className="mt-4 text-sm text-inv-muted">{interpolate(t.respondedOn, { date: existing.submittedLabel })}</p>
        )}

        {confirmation.personalUrl && (
          <div className="mt-10 border-t border-inv-line pt-8">
            <p className="text-sm text-inv-muted">{t.personalLink}</p>
            <p className="mt-3 break-all font-serif text-lg">{confirmation.personalUrl}</p>
            <button type="button" onClick={() => copy(confirmation.personalUrl!)} className="inv-link mt-2">
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
        )}

        {settings.rsvpOpen && (guest || !confirmation.personalUrl) && (
          settings.allowUpdates ? (
            <button type="button" onClick={() => setEditing(true)} className="inv-button mt-10">
              {t.changeResponse}
            </button>
          ) : (
            <p className="mt-8 text-sm text-inv-muted">{t.locked}</p>
          )
        )}
      </div>
    );
  }

  if (!settings.rsvpOpen) {
    return <p className="mx-auto max-w-lg text-center leading-8 text-inv-muted">{t.closed}</p>;
  }

  if (!guest && !settings.openRsvp) {
    return <p className="mx-auto max-w-lg text-center leading-8 text-inv-muted">{t.personalOnly}</p>;
  }

  const rememberedEntry = !guest && remembered ? safeParse(remembered) : null;

  // --- Form -------------------------------------------------------------
  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: string) => `${formId}-${name}-error`;
  const describedBy = (name: string, hint?: string) =>
    [errors[name] ? errorId(name) : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-xl" aria-busy={submitting}>
      {rememberedEntry?.url && (
        <p className="mb-10 rounded-[var(--inv-card-radius)] border border-inv-line px-5 py-4 text-center text-sm leading-6 text-inv-muted">
          {rememberedEntry.name && <span className="block font-serif text-lg text-inv-text">{rememberedEntry.name}</span>}
          <a href={rememberedEntry.url} className="inv-link">
            {t.changeResponse}
          </a>
        </p>
      )}

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input id={fieldId("website")} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="flex flex-col gap-10">
        <Field label={t.name} id={fieldId("name")} error={errors.name} errorId={errorId("name")}>
          <input
            id={fieldId("name")}
            className="inv-field"
            autoComplete="name"
            required
            maxLength={120}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
          />
        </Field>

        <fieldset aria-describedby={describedBy("attendance")}>
          <legend className="inv-eyebrow mb-5 text-[0.625rem] text-inv-muted">{t.attendance}</legend>
          <div className="grid gap-3 sm:grid-cols-2" id={fieldId("attendance")} tabIndex={-1}>
            {(["ATTENDING", "DECLINED"] as const).map((option) => {
              const checked = values.attendance === option;
              return (
                <label
                  key={option}
                  className={cn(
                    "flex min-h-16 items-center gap-4 rounded-[var(--inv-card-radius)] border px-5 py-4 transition-colors duration-500",
                    checked ? "border-inv-text bg-inv-text text-inv-bg" : "border-inv-line hover:border-inv-text",
                  )}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={option}
                    checked={checked}
                    onChange={() => set("attendance", option)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                      checked ? "border-inv-bg" : "border-inv-muted",
                    )}
                    aria-hidden="true"
                  >
                    {checked && <span className="h-2 w-2 rounded-full bg-inv-bg" />}
                  </span>
                  <span className="font-serif text-lg leading-snug">{option === "ATTENDING" ? t.attending : t.declining}</span>
                </label>
              );
            })}
          </div>
          <FieldError id={errorId("attendance")} message={errors.attendance} />
        </fieldset>

        {attending && (
          <>
            {settings.askGuestCount && maxGuests > 1 && (
              <Field
                label={t.guestCount}
                id={fieldId("guestCount")}
                hint={interpolate(t.guestCountHint, { max: maxGuests })}
                hintId={`${formId}-guestCount-hint`}
                error={errors.guestCount}
                errorId={errorId("guestCount")}
              >
                <select
                  id={fieldId("guestCount")}
                  className="inv-field appearance-none"
                  value={values.guestCount}
                  onChange={(e) => set("guestCount", Number(e.target.value))}
                  aria-invalid={!!errors.guestCount}
                  aria-describedby={describedBy("guestCount", `${formId}-guestCount-hint`)}
                >
                  {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {settings.askCompanions && values.guestCount > 1 && (
              <Field label={t.companions} id={fieldId("companionNames")} hint={t.companionsHint} hintId={`${formId}-companions-hint`}>
                <input
                  id={fieldId("companionNames")}
                  className="inv-field"
                  maxLength={500}
                  value={values.companionNames}
                  onChange={(e) => set("companionNames", e.target.value)}
                  aria-describedby={`${formId}-companions-hint`}
                />
              </Field>
            )}

            {settings.askTransportation && (
              <fieldset>
                <legend className="inv-eyebrow mb-4 text-[0.625rem] text-inv-muted">{t.transport}</legend>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((option) => {
                    const checked = values.transportationNeeded === option;
                    return (
                      <label
                        key={option}
                        className={cn(
                          "flex min-h-12 min-w-24 items-center justify-center rounded-[var(--inv-radius)] border px-6 text-sm transition-colors duration-500 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                          checked ? "border-inv-text bg-inv-text text-inv-bg" : "border-inv-line hover:border-inv-text",
                        )}
                      >
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
              </fieldset>
            )}

            {settings.askDietary && (
              <Field label={t.dietary} id={fieldId("dietaryRestrictions")} optional={t.optional}>
                <input
                  id={fieldId("dietaryRestrictions")}
                  className="inv-field"
                  maxLength={500}
                  value={values.dietaryRestrictions}
                  onChange={(e) => set("dietaryRestrictions", e.target.value)}
                />
              </Field>
            )}
          </>
        )}

        {settings.askPhone && (
          <Field label={t.phone} id={fieldId("phone")} optional={t.optional} error={errors.phone} errorId={errorId("phone")}>
            <input
              id={fieldId("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="inv-field"
              maxLength={32}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
              aria-describedby={describedBy("phone")}
            />
          </Field>
        )}

        {settings.askMessage && (
          <Field label={t.message} id={fieldId("message")} optional={t.optional}>
            <textarea
              id={fieldId("message")}
              className="inv-field min-h-28 resize-y leading-7"
              maxLength={1500}
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </Field>
        )}
      </div>

      <div aria-live="polite" className="min-h-6">
        {formError && <p className="mt-8 text-center text-sm text-inv-accent">{formError}</p>}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button type="submit" className="inv-button w-full sm:w-auto" disabled={submitting}>
          {submitting ? t.submitting : existing || confirmation ? t.update : t.submit}
        </button>
        {settings.deadlineLabel && (
          <p className="text-xs text-inv-muted">{interpolate(t.deadline, { date: settings.deadlineLabel })}</p>
        )}
      </div>
    </form>
  );
}

function safeParse(raw: string): { name?: string; url?: string } | null {
  try {
    const value = JSON.parse(raw) as { name?: unknown; url?: unknown };
    const url = typeof value.url === "string" && value.url.startsWith("http") ? value.url : undefined;
    return { name: typeof value.name === "string" ? value.name : undefined, url };
  } catch {
    return null;
  }
}

type FieldProps = {
  label: string;
  id: string;
  optional?: string;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
};

function Field({ label, id, optional, hint, hintId, error, errorId, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="inv-eyebrow flex items-baseline justify-between gap-4 text-[0.625rem] text-inv-muted">
        <span>{label}</span>
        {optional && <span className="normal-case tracking-normal opacity-70">{optional}</span>}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="mt-2 text-xs text-inv-muted">
          {hint}
        </p>
      )}
      {errorId && <FieldError id={errorId} message={error} />}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-xs text-inv-accent" role="alert">
      {message}
    </p>
  );
}
