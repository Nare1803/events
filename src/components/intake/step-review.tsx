"use client";

import { LOCALE_LABELS } from "@/lib/i18n/locales";
import { MUSIC_CHOICE_LABELS, RSVP_FIELD_LABELS } from "@/lib/projects/intake";
import { CONTACT_LABELS, CONTACT_METHODS } from "@/lib/validation/project";
import { Check, Chip, Field, OptionCard, StepHeading } from "./fields";
import type { PackageOption, StepProps, TemplateOption } from "./types";

type ReviewProps = StepProps & { templates: TemplateOption[]; packages: PackageOption[]; goTo: (step: number) => void };

function Row({ label, step, goTo, children }: { label: string; step: number; goTo: (n: number) => void; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr_auto] sm:gap-6">
      <dt className="inv-eyebrow text-[0.625rem] text-inv-muted">{label}</dt>
      <dd className="text-sm leading-6">{children}</dd>
      <dd>
        <button type="button" onClick={() => goTo(step)} className="inv-link">
          Edit
        </button>
      </dd>
    </div>
  );
}

export function StepReview({ state, update, errors, templates, packages, goTo }: ReviewProps) {
  const e = state.event;
  const template = templates.find((t) => t.key === state.templateKey);
  const setContact = (patch: Partial<typeof state.contact>) => update((s) => ({ ...s, contact: { ...s.contact, ...patch } }));
  const photos = state.files.filter((f) => f.kind !== "MUSIC");
  const schedule = state.schedule.filter((r) => r.title || r.venue);

  return (
    <>
      <StepHeading eyebrow="Final step" title="Review & submit" text="Check everything once more. Nothing is published until you approve your private preview." />

      <dl className="divide-y divide-inv-line border-y border-inv-line">
        <Row label="Event" step={0} goTo={goTo}>
          <span className="font-serif text-xl">{[e.partnerOne, e.partnerTwo].filter(Boolean).join(" & ") || "—"}</span>
          <br />
          {e.date || "Date to be confirmed"} · {[e.locale, ...e.extraLocales].map((l) => LOCALE_LABELS[l].native).join(", ")}
        </Row>
        <Row label="Style" step={1} goTo={goTo}>
          {template?.name ?? "—"}
        </Row>
        <Row label="Story" step={2} goTo={goTo}>
          {state.story.writeForMe ? "ORÉ writes the text" : state.story.welcomeText || "—"}
          {state.story.vibe.length > 0 && <span className="block text-inv-muted">{state.story.vibe.join(" · ")}</span>}
        </Row>
        <Row label="Photos" step={3} goTo={goTo}>
          {photos.length ? `${photos.length} photo${photos.length === 1 ? "" : "s"}` : "Sending later"}
        </Row>
        <Row label="Music" step={4} goTo={goTo}>
          {MUSIC_CHOICE_LABELS[state.music.choice]}
          {state.music.reference && <span className="block text-inv-muted">{state.music.reference}</span>}
        </Row>
        <Row label="The day" step={5} goTo={goTo}>
          {schedule.length ? schedule.map((r) => [r.time, r.title, r.venue].filter(Boolean).join(" · ")).join(" / ") : "—"}
        </Row>
        <Row label="Dress code" step={6} goTo={goTo}>
          {state.dressCode.enabled ? state.dressCode.name || "Yes" : "None"}
        </Row>
        <Row label="RSVP" step={7} goTo={goTo}>
          {["attendance", ...state.rsvp.fields.filter((f) => f !== "attendance")].map((f) => RSVP_FIELD_LABELS[f]).join(", ")}
        </Row>
        <Row label="Guests" step={8} goTo={goTo}>
          {state.guests.mode === "upload" && state.guests.rows.length ? `${state.guests.rows.length} guests` : "Sending later"}
        </Row>
        <Row label="Notes" step={9} goTo={goTo}>
          {state.notes ? <span className="line-clamp-3 whitespace-pre-line">{state.notes}</span> : "—"}
        </Row>
      </dl>

      {packages.length > 0 && (
        <fieldset className="mt-14">
          <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">Your package</legend>
          <div className="mt-4 grid gap-3">
            {packages.map((p) => (
              <OptionCard
                key={p.key}
                name="package"
                checked={state.packageKey === p.key}
                onSelect={() => update((s) => ({ ...s, packageKey: p.key }))}
                title={`${p.name}${p.price ? ` — ${p.price}` : ""}`}
                description={p.tagline}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-inv-muted">We&apos;ll confirm the details and price with you personally before we begin.</p>
        </fieldset>
      )}

      <fieldset className="mt-14">
        <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">How can we reach you?</legend>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <Field label="Your name" value={state.contact.name} onChange={(v) => setContact({ name: v })} error={errors["contact.name"]} autoComplete="name" maxLength={120} className="sm:col-span-2" />
          <Field label="Phone / WhatsApp" type="tel" inputMode="tel" value={state.contact.phone} onChange={(v) => setContact({ phone: v })} error={errors["contact.phone"]} autoComplete="tel" maxLength={32} />
          <Field label="Email" type="email" inputMode="email" value={state.contact.email} onChange={(v) => setContact({ email: v })} error={errors["contact.email"]} autoComplete="email" maxLength={200} />
        </div>
        <p className="mt-8 text-sm text-inv-muted">Preferred way to talk</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTACT_METHODS.map((m) => (
            <Chip key={m} selected={state.contact.preferredContact === m} onClick={() => setContact({ preferredContact: m })}>
              {CONTACT_LABELS[m]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="mt-12">
        <Check checked={state.consent} onChange={(v) => update((s) => ({ ...s, consent: v }))} error={errors.consent}>
          I agree that ORÉ may use the information and photos I&apos;ve shared — including my guests&apos; names and contact details — only to create and
          deliver this invitation.
        </Check>
      </div>
    </>
  );
}
