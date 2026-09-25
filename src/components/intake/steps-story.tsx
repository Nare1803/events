"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/locales";
import { VIBES } from "@/lib/projects/intake";
import { UPLOAD_LIMITS } from "@/lib/validation/intake";
import { COUPLE_EVENTS, type EventType } from "@/lib/validation/enums";
import { TemplatePreview } from "@/components/site/template-preview";
import { cn } from "@/lib/utils/cn";
import { Check, Chip, Field, OptionCard, StepHeading } from "./fields";
import { Uploader } from "./uploader";
import type { StepProps, TemplateOption } from "./types";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "WEDDING", label: "Wedding" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "BAPTISM", label: "Baptism" },
  { value: "OTHER", label: "Other" },
];

export function StepEvent({ state, update, errors }: StepProps) {
  const couple = COUPLE_EVENTS.includes(state.event.type);
  const set = (patch: Partial<typeof state.event>) => update((s) => ({ ...s, event: { ...s.event, ...patch } }));
  return (
    <>
      <StepHeading eyebrow="Step one" title="Your event" text="The essentials — everything else can come later." />
      <fieldset>
        <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">What are we celebrating?</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <Chip key={t.value} selected={state.event.type === t.value} onClick={() => set({ type: t.value })}>
              {t.label}
            </Chip>
          ))}
        </div>
        {!couple && <p className="mt-3 text-xs text-inv-muted">Our collections are crafted for weddings first — we&apos;ll adapt the wording for your celebration.</p>}
      </fieldset>
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <Field label={couple ? "Partner 1 name" : "Name"} value={state.event.partnerOne} onChange={(v) => set({ partnerOne: v })} error={errors["event.partnerOne"]} maxLength={60} autoComplete="off" />
        <Field
          label={couple ? "Partner 2 name" : "Second name"}
          optional={!couple}
          value={state.event.partnerTwo}
          onChange={(v) => set({ partnerTwo: v })}
          error={errors["event.partnerTwo"]}
          maxLength={60}
          autoComplete="off"
        />
        <Field label="Event date" type="date" value={state.event.date} onChange={(v) => set({ date: v })} error={errors["event.date"]} />
      </div>
      <fieldset className="mt-10">
        <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">Invitation language</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <Chip key={l} selected={state.event.locale === l} onClick={() => set({ locale: l, extraLocales: state.event.extraLocales.filter((x) => x !== l) })}>
              {LOCALE_LABELS[l].native}
            </Chip>
          ))}
        </div>
        <p className="mt-6 text-sm text-inv-muted">Also offer your guests:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LOCALES.filter((l) => l !== state.event.locale).map((l: Locale) => {
            const on = state.event.extraLocales.includes(l);
            return (
              <Chip key={l} selected={on} onClick={() => set({ extraLocales: on ? state.event.extraLocales.filter((x) => x !== l) : [...state.event.extraLocales, l] })}>
                {LOCALE_LABELS[l].native}
              </Chip>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

export function StepStyle({ state, update, templates }: StepProps & { templates: TemplateOption[] }) {
  return (
    <>
      <StepHeading eyebrow="Step two" title="Choose your style" text="Every collection works beautifully on phones and in Armenian, English and Russian." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Invitation style">
        {templates.map((t) => {
          const selected = state.templateKey === t.key;
          return (
            <div key={t.key}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={!t.available}
                onClick={() => t.available && update((s) => ({ ...s, templateKey: t.key }))}
                className={cn("group block w-full text-left", !t.available && "cursor-not-allowed")}
              >
                <span
                  className={cn(
                    "relative block overflow-hidden border text-[13px] transition-shadow duration-300",
                    selected ? "border-inv-text ring-2 ring-inv-text ring-offset-4 ring-offset-[var(--inv-bg)]" : "border-inv-line",
                  )}
                >
                  <TemplatePreview tokens={t.tokens} heroVariant={t.heroVariant} muted={!t.available} />
                  {!t.available && (
                    <span className="absolute left-3 top-3 bg-inv-bg px-2.5 py-1 text-[0.55rem] font-medium uppercase tracking-[0.24em]">Coming soon</span>
                  )}
                </span>
                <span className="mt-4 block font-serif text-2xl">{t.name}</span>
                <span className="mt-1 block text-sm text-inv-muted">{t.description}</span>
              </button>
              {t.available && (
                <a href={`/designs/${t.key}`} target="_blank" rel="noopener noreferrer" className="inv-link mt-1">
                  View live example
                </a>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function StepStory({ state, update }: StepProps) {
  const set = (patch: Partial<typeof state.story>) => update((s) => ({ ...s, story: { ...s.story, ...patch } }));
  return (
    <>
      <StepHeading eyebrow="Step three" title="Your story" text="A few words for your guests — or leave the writing to us." />
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard name="writing" checked={state.story.writeForMe} onSelect={() => set({ writeForMe: true })} title="Write it for me" description="Our studio writes the invitation text in your chosen languages." />
        <OptionCard name="writing" checked={!state.story.writeForMe} onSelect={() => set({ writeForMe: false })} title="I'll write it" description="Share your own welcome words below." />
      </div>
      {!state.story.writeForMe && (
        <Field
          className="mt-8"
          label="Welcome / invitation text"
          multiline
          rows={5}
          maxLength={1500}
          value={state.story.welcomeText}
          onChange={(v) => set({ welcomeText: v })}
          placeholder="Some moments are too special not to share…"
        />
      )}
      <fieldset className="mt-12">
        <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">How would you describe your celebration?</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const on = state.story.vibe.includes(v);
            return (
              <Chip key={v} selected={on} onClick={() => set({ vibe: on ? state.story.vibe.filter((x) => x !== v) : [...state.story.vibe, v] })}>
                {v}
              </Chip>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}

export function StepPhotos({ state, update }: StepProps) {
  const add = (file: (typeof state.files)[number]) => update((s) => ({ ...s, files: [...s.files, file] }));
  const remove = (id: string) => update((s) => ({ ...s, files: s.files.filter((f) => f.id !== id) }));
  const of = (kind: string) => state.files.filter((f) => f.kind === kind);
  return (
    <>
      <StepHeading eyebrow="Step four" title="Photos" text="Original, high-resolution photos work best. We optimise them and remove location data automatically." />
      <div className="flex flex-col gap-10">
        <Uploader kind="HERO" label="Main photo" hint="The first image your guests see. Portrait photos work beautifully." max={UPLOAD_LIMITS.HERO} draftKey={state.draftKey} files={of("HERO")} onAdd={add} onRemove={remove} />
        <Uploader kind="GALLERY" label="Your story" hint={`Up to ${UPLOAD_LIMITS.GALLERY} photos. We'll choose and arrange the most beautiful ones.`} max={UPLOAD_LIMITS.GALLERY} draftKey={state.draftKey} files={of("GALLERY")} onAdd={add} onRemove={remove} />
        <Uploader kind="ENGAGEMENT" label="Engagement photos (optional)" hint={`Up to ${UPLOAD_LIMITS.ENGAGEMENT} photos.`} max={UPLOAD_LIMITS.ENGAGEMENT} draftKey={state.draftKey} files={of("ENGAGEMENT")} onAdd={add} onRemove={remove} />
      </div>
      <p className="mt-10 text-center text-sm text-inv-muted">No photos yet? Continue — you can send them to us later.</p>
    </>
  );
}

export function StepMusic({ state, update, errors }: StepProps) {
  const set = (patch: Partial<typeof state.music>) => update((s) => ({ ...s, music: { ...s.music, ...patch } }));
  const music = state.files.filter((f) => f.kind === "MUSIC");
  const options = [
    { value: "RECOMMEND", title: "Recommend something", description: "We'll choose a licensed track that suits your style." },
    { value: "REFERENCE", title: "I have a song in mind", description: "Share the name or a link — we'll find a way to use it properly." },
    { value: "UPLOAD", title: "Upload a song", description: "A file you own or have permission to use." },
    { value: "NONE", title: "No music", description: "A quiet, elegant invitation." },
  ] as const;
  return (
    <>
      <StepHeading eyebrow="Step five" title="Music" text="Music starts softly when guests open the invitation, and they can pause it anytime." />
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <OptionCard key={o.value} name="music" checked={state.music.choice === o.value} onSelect={() => set({ choice: o.value })} title={o.title} description={o.description} />
        ))}
      </div>
      {state.music.choice === "REFERENCE" && (
        <Field className="mt-8" label="Song name, artist or link" value={state.music.reference} onChange={(v) => set({ reference: v })} maxLength={500} placeholder="e.g. “La Vie en rose” — or a YouTube / Spotify link" />
      )}
      {state.music.choice === "UPLOAD" && (
        <div className="mt-8 flex flex-col gap-6">
          <Uploader
            kind="MUSIC"
            label="Your song"
            hint="MP3 or M4A, up to 12 MB."
            max={1}
            audio
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav"
            draftKey={state.draftKey}
            files={music}
            onAdd={(file) => update((s) => ({ ...s, files: [...s.files, file] }))}
            onRemove={(id) => update((s) => ({ ...s, files: s.files.filter((f) => f.id !== id) }))}
          />
          <Check checked={state.music.rightsConfirmed} onChange={(v) => set({ rightsConfirmed: v })} error={errors["music.rightsConfirmed"]}>
            I own this recording or have permission to use it. If we can&apos;t verify the rights, we&apos;ll suggest a licensed alternative.
          </Check>
        </div>
      )}
    </>
  );
}
