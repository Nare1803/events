"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { intakeCopy } from "@/content/site";
import { getTheme, themeStyle } from "@/lib/themes";
import { COUPLE_EVENTS } from "@/lib/validation/enums";
import { cn } from "@/lib/utils/cn";
import { StepReview } from "./step-review";
import { StepDay, StepDress, StepGuests, StepNotes, StepRsvp } from "./steps-details";
import { StepEvent, StepMusic, StepPhotos, StepStory, StepStyle } from "./steps-story";
import type { IntakeState, PackageOption, StepProps, TemplateOption } from "./types";

const STORAGE_KEY = "ore:intake:v1";
const LAST = intakeCopy.steps.length - 1;

function randomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function freshState(templateKey: string, packageKey: string): IntakeState {
  return {
    version: 1,
    draftKey: randomKey(),
    step: 0,
    visited: 0,
    event: { type: "WEDDING", partnerOne: "", partnerTwo: "", date: "", locale: "hy", extraLocales: [] },
    templateKey,
    story: { writeForMe: true, welcomeText: "", vibe: [] },
    files: [],
    music: { choice: "RECOMMEND", reference: "", rightsConfirmed: false },
    schedule: [{ key: "first", time: "", title: "", venue: "", address: "", notes: "" }],
    dressCode: { enabled: false, name: "", description: "", colors: [] },
    rsvp: { fields: ["attendance", "guestCount", "companions", "dietary", "message"], deadline: "" },
    guests: { mode: "later", rows: [], fileName: "", invalid: 0, duplicates: 0 },
    notes: "",
    contact: { name: "", email: "", phone: "", preferredContact: "WHATSAPP" },
    packageKey,
    consent: false,
  };
}

/** Restores a saved draft; URL choices (?template, ?package) take precedence. */
function initialState(templates: TemplateOption[], packages: PackageOption[], wantedTemplate?: string, wantedPackage?: string): IntakeState {
  const availableTemplate = (key?: string) => (key && templates.some((t) => t.key === key && t.available) ? key : undefined);
  const knownPackage = (key?: string) => (key && packages.some((p) => p.key === key) ? key : undefined);
  const defaultTemplate = availableTemplate(wantedTemplate) ?? templates.find((t) => t.available)?.key ?? "editorial-nude";
  const defaultPackage = knownPackage(wantedPackage) ?? packages.find((p) => p.isDefault)?.key ?? packages[0]?.key ?? "";
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as IntakeState | null;
    if (saved?.version === 1 && saved.draftKey) {
      return {
        ...saved,
        templateKey: availableTemplate(wantedTemplate) ?? availableTemplate(saved.templateKey) ?? defaultTemplate,
        packageKey: knownPackage(wantedPackage) ?? knownPackage(saved.packageKey) ?? defaultPackage,
      };
    }
  } catch {
    // Corrupt or unavailable storage — start fresh.
  }
  return freshState(defaultTemplate, defaultPackage);
}

/** Client-side checks per step; the server validates everything again. */
function validate(state: IntakeState, step: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!state.event.partnerOne.trim()) errors["event.partnerOne"] = "Please add a name.";
    if (COUPLE_EVENTS.includes(state.event.type) && !state.event.partnerTwo.trim()) errors["event.partnerTwo"] = "Please add the second name.";
    if (!state.event.date) errors["event.date"] = "Please choose the date.";
  }
  if (step === 4 && state.music.choice === "UPLOAD" && state.files.some((f) => f.kind === "MUSIC") && !state.music.rightsConfirmed) {
    errors["music.rightsConfirmed"] = "Please confirm you may use this song — or choose another option.";
  }
  if (step === LAST) {
    if (!state.contact.name.trim()) errors["contact.name"] = "Please tell us your name.";
    if (!state.contact.phone.trim() && !state.contact.email.trim()) errors["contact.phone"] = "Add a phone number or an email so we can reach you.";
    if (state.contact.phone.trim() && !/^\+?[\d\s().-]{6,24}$/.test(state.contact.phone.trim())) errors["contact.phone"] = "Please check the phone number.";
    if (state.contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email.trim())) errors["contact.email"] = "Please check the email address.";
    if (!state.consent) errors.consent = "Please confirm to continue.";
  }
  return errors;
}

/** Which step owns a server-side field error (for jumping back to it). */
function stepForField(field: string): number {
  if (field.startsWith("event")) return 0;
  if (field.startsWith("story")) return 2;
  if (field.startsWith("music")) return 4;
  if (field.startsWith("schedule")) return 5;
  if (field.startsWith("dressCode")) return 6;
  if (field.startsWith("rsvp")) return 7;
  if (field.startsWith("guests")) return 8;
  if (field.startsWith("notes")) return 9;
  return LAST;
}

type WizardProps = { templates: TemplateOption[]; packages: PackageOption[]; wantedTemplate?: string; wantedPackage?: string };

export function IntakeWizard({ templates, packages, wantedTemplate, wantedPackage }: WizardProps) {
  const [state, setState] = useState<IntakeState>(() => initialState(templates, packages, wantedTemplate, wantedPackage));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string | null } | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const top = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (done) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode / full storage: the form still works, it just isn't saved.
    }
  }, [state, done]);

  // Move focus to the new step's heading so keyboard & screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    top.current?.parentElement?.querySelector<HTMLElement>("[data-step-heading]")?.focus({ preventScroll: true });
  }, [state.step]);

  const update: StepProps["update"] = (patch) => {
    setState((s) => patch(s));
    // Messages refer to the previous answers; they are re-checked on Continue / Submit.
    setErrors((e) => (Object.keys(e).length ? {} : e));
  };
  const goTo = (step: number) => {
    setErrors({});
    setState((s) => ({ ...s, step, visited: Math.max(s.visited, step) }));
  };

  const next = () => {
    const found = validate(state, state.step);
    setErrors(found);
    if (Object.keys(found).length) return;
    goTo(Math.min(LAST, state.step + 1));
  };

  async function submit() {
    const found = validate(state, LAST);
    const eventErrors = validate(state, 0);
    setErrors({ ...found, ...eventErrors });
    if (Object.keys(eventErrors).length) return goTo(0);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      draftKey: state.draftKey,
      event: state.event,
      templateKey: state.templateKey,
      story: { ...state.story, welcomeText: state.story.writeForMe ? "" : state.story.welcomeText },
      music: { choice: state.music.choice, reference: state.music.choice === "REFERENCE" ? state.music.reference : "", rightsConfirmed: state.music.rightsConfirmed },
      schedule: state.schedule.map(({ time, title, venue, address, notes }) => ({ time, title, venue, address, notes })),
      dressCode: state.dressCode.enabled ? state.dressCode : { enabled: false, name: "", description: "", colors: [] },
      rsvp: { fields: Array.from(new Set(["attendance", ...state.rsvp.fields])), deadline: state.rsvp.deadline },
      guests: { mode: state.guests.mode, rows: state.guests.mode === "upload" ? state.guests.rows : [] },
      notes: state.notes,
      contact: state.contact,
      packageKey: state.packageKey,
      consent: state.consent,
      website: honeypot,
    };
    try {
      const response = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = (await response.json().catch(() => null)) as { ok: boolean; reference?: string | null; error?: string; fieldErrors?: Record<string, string> } | null;
      if (body?.ok) {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setDone({ reference: body.reference ?? null });
        window.scrollTo({ top: 0 });
        return;
      }
      if (body?.error === "VALIDATION" && body.fieldErrors) {
        const first = Object.keys(body.fieldErrors)[0] ?? "";
        setErrors(body.fieldErrors);
        setSubmitError("Something needs another look — we've taken you to it.");
        goTo(stepForField(first));
        return;
      }
      setSubmitError(
        body?.error === "RATE_LIMITED" ? "Too many attempts — please wait a few minutes and try again." : "We couldn't send your request. Please try again.",
      );
    } catch {
      setSubmitError("Connection problem — please check your internet and try again. Your answers are saved.");
    } finally {
      setSubmitting(false);
    }
  }

  const style = themeStyle(getTheme("editorial-nude"));

  if (done) {
    return (
      <div style={style} className="inv-root flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
        <p className="inv-eyebrow text-inv-accent">{brand.name}</p>
        <h1 className="inv-display mt-8 text-6xl italic">{intakeCopy.thanksTitle}</h1>
        <p className="mt-8 max-w-md font-serif text-2xl leading-snug">{intakeCopy.thanksText}</p>
        {brand.turnaroundNote && <p className="mt-6 max-w-md leading-7 text-inv-muted">{brand.turnaroundNote}</p>}
        <p className="mt-6 max-w-md leading-7 text-inv-muted">{intakeCopy.thanksNext}</p>
        {done.reference && (
          <p className="mt-10 border-y border-inv-line px-8 py-4">
            <span className="inv-eyebrow block text-[0.625rem] text-inv-muted">{intakeCopy.reference}</span>
            <span className="mt-2 block font-serif text-2xl tracking-wider">{done.reference}</span>
          </p>
        )}
        <Link href="/" className="inv-link mt-12">
          {brand.name}
        </Link>
      </div>
    );
  }

  const stepProps: StepProps = { state, update, errors };
  const steps = [
    <StepEvent key="event" {...stepProps} />,
    <StepStyle key="style" {...stepProps} templates={templates} />,
    <StepStory key="story" {...stepProps} />,
    <StepPhotos key="photos" {...stepProps} />,
    <StepMusic key="music" {...stepProps} />,
    <StepDay key="day" {...stepProps} />,
    <StepDress key="dress" {...stepProps} />,
    <StepRsvp key="rsvp" {...stepProps} />,
    <StepGuests key="guests" {...stepProps} />,
    <StepNotes key="notes" {...stepProps} />,
    <StepReview key="review" {...stepProps} templates={templates} packages={packages} goTo={goTo} />,
  ];
  const progress = ((state.step + 1) / steps.length) * 100;

  return (
    <div style={style} className="inv-root min-h-dvh">
      <div ref={top} className="scroll-mt-0" />
      <div className="sticky top-0 z-20 border-b border-inv-line bg-inv-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-serif text-xl tracking-[0.24em]">
            {brand.name}
          </Link>
          <p className="text-xs text-inv-muted" aria-live="polite">
            {state.step + 1} / {steps.length} · {intakeCopy.steps[state.step]}
          </p>
        </div>
        <div className="h-px bg-inv-line">
          <div className="h-px bg-inv-text transition-[width] duration-700 ease-[var(--ease-editorial)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav aria-label="Order form steps" className="mx-auto hidden max-w-3xl px-6 pt-6 md:block">
        <ol className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[0.625rem] uppercase tracking-[0.18em]">
          {intakeCopy.steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > state.visited}
                onClick={() => goTo(i)}
                aria-current={i === state.step ? "step" : undefined}
                className={cn("py-1 transition-opacity", i === state.step ? "opacity-100 underline underline-offset-4" : i <= state.visited ? "opacity-60 hover:opacity-100" : "opacity-25")}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-40 pt-14 sm:pt-20">
        {state.step === 0 && (
          <div className="mb-14 text-center">
            <h1 className="inv-display text-5xl sm:text-6xl">{intakeCopy.title}</h1>
            <p className="mx-auto mt-5 max-w-md leading-7 text-inv-muted">{intakeCopy.intro}</p>
          </div>
        )}

        {steps[state.step]}

        {/* Honeypot */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="intake-website">Website</label>
          <input id="intake-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div aria-live="polite">{submitError && <p className="mt-10 text-center text-sm text-inv-accent">{submitError}</p>}</div>

        <div className="mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-inv-line pt-8 sm:flex-row">
          {state.step > 0 ? (
            <button type="button" onClick={() => goTo(state.step - 1)} className="inv-link">
              {intakeCopy.back}
            </button>
          ) : (
            <span className="text-xs text-inv-muted">{intakeCopy.saved}</span>
          )}
          {state.step < LAST ? (
            <button type="button" onClick={next} className="inv-button inv-button-solid w-full sm:w-auto">
              {intakeCopy.next}
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="inv-button inv-button-solid w-full sm:w-auto" aria-busy={submitting}>
              {submitting ? intakeCopy.submitting : intakeCopy.submit}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
