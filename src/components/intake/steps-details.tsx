"use client";

import { useState } from "react";
import { buildPreview, parseCsv } from "@/lib/guests/import";
import { RSVP_FIELD_LABELS } from "@/lib/projects/intake";
import { MAX_IMPORT_ROWS } from "@/lib/validation/guest";
import { RSVP_FIELDS, UPLOAD_LIMITS } from "@/lib/validation/intake";
import { Check, Chip, Field, OptionCard, StepHeading } from "./fields";
import { Uploader } from "./uploader";
import type { ScheduleRow, StepProps } from "./types";

const newRow = (): ScheduleRow => ({ key: Math.random().toString(36).slice(2), time: "", title: "", venue: "", address: "", notes: "" });

export function StepDay({ state, update }: StepProps) {
  const rows = state.schedule.length ? state.schedule : [newRow()];
  const setRow = (key: string, patch: Partial<ScheduleRow>) =>
    update((s) => ({ ...s, schedule: (s.schedule.length ? s.schedule : rows).map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  return (
    <>
      <StepHeading eyebrow="Step six" title="The day" text="Ceremony, restaurant, party — add each moment of the day with its venue." />
      <ol className="flex flex-col gap-8">
        {rows.map((row, i) => (
          <li key={row.key} className="border border-inv-line p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-xl">{String(i + 1).padStart(2, "0")}</span>
              {rows.length > 1 && (
                <button type="button" className="inv-link" onClick={() => update((s) => ({ ...s, schedule: rows.filter((r) => r.key !== row.key) }))}>
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-[140px_1fr]">
              <Field label="Time" type="time" value={row.time} onChange={(v) => setRow(row.key, { time: v })} />
              <Field label="What happens" value={row.title} onChange={(v) => setRow(row.key, { title: v })} placeholder="Wedding ceremony" maxLength={120} />
              <Field label="Venue" value={row.venue} onChange={(v) => setRow(row.key, { venue: v })} placeholder="Saint Gayane Church" maxLength={120} className="sm:col-span-2" />
              <Field label="Address" value={row.address} onChange={(v) => setRow(row.key, { address: v })} placeholder="Vagharshapat, Armenia" maxLength={300} className="sm:col-span-2" />
              <Field label="Notes" optional value={row.notes} onChange={(v) => setRow(row.key, { notes: v })} maxLength={400} className="sm:col-span-2" />
            </div>
          </li>
        ))}
      </ol>
      {rows.length < 15 && (
        <div className="mt-6 text-center">
          <button type="button" className="inv-button" onClick={() => update((s) => ({ ...s, schedule: [...rows, newRow()] }))}>
            Add another moment
          </button>
        </div>
      )}
    </>
  );
}

export function StepDress({ state, update }: StepProps) {
  const d = state.dressCode;
  const set = (patch: Partial<typeof d>) => update((s) => ({ ...s, dressCode: { ...s.dressCode, ...patch } }));
  const images = state.files.filter((f) => f.kind === "DRESS_CODE");
  return (
    <>
      <StepHeading eyebrow="Step seven" title="Dress code" text="Optional — skip it if you'd rather not set one." />
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard name="dress" checked={d.enabled} onSelect={() => set({ enabled: true })} title="Yes, add a dress code" />
        <OptionCard name="dress" checked={!d.enabled} onSelect={() => set({ enabled: false })} title="No dress code" />
      </div>
      {d.enabled && (
        <div className="mt-10 flex flex-col gap-8">
          <Field label="Dress code name" value={d.name} onChange={(v) => set({ name: v })} placeholder="Elegant evening" maxLength={80} />
          <Field label="Description" optional multiline rows={3} value={d.description} onChange={(v) => set({ description: v })} maxLength={600} placeholder="Floor-length gowns and dark suits are warmly welcomed." />
          <fieldset>
            <legend className="inv-eyebrow text-[0.625rem] text-inv-muted">Preferred colours (up to 6)</legend>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {d.colors.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={c}
                    aria-label={`Colour ${i + 1}`}
                    onChange={(e) => set({ colors: d.colors.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)) })}
                    className="h-11 w-11 cursor-pointer rounded-full border border-inv-line bg-transparent p-0.5"
                  />
                  <button type="button" onClick={() => set({ colors: d.colors.filter((_, j) => j !== i) })} className="px-1 text-sm text-inv-muted" aria-label={`Remove colour ${i + 1}`}>
                    ×
                  </button>
                </span>
              ))}
              {d.colors.length < 6 && (
                <Chip selected={false} onClick={() => set({ colors: [...d.colors, "#BBAA9D"] })}>
                  Add colour
                </Chip>
              )}
            </div>
          </fieldset>
          <Uploader
            kind="DRESS_CODE"
            label="Reference image (optional)"
            hint="A mood image for your guests."
            max={UPLOAD_LIMITS.DRESS_CODE}
            draftKey={state.draftKey}
            files={images}
            onAdd={(file) => update((s) => ({ ...s, files: [...s.files, file] }))}
            onRemove={(id) => update((s) => ({ ...s, files: s.files.filter((f) => f.id !== id) }))}
          />
        </div>
      )}
    </>
  );
}

export function StepRsvp({ state, update }: StepProps) {
  const toggle = (field: string) =>
    update((s) => ({ ...s, rsvp: { ...s.rsvp, fields: s.rsvp.fields.includes(field) ? s.rsvp.fields.filter((f) => f !== field) : [...s.rsvp.fields, field] } }));
  return (
    <>
      <StepHeading eyebrow="Step eight" title="RSVP" text="Which details should your guests share when they reply?" />
      <ul className="flex flex-col divide-y divide-inv-line border-y border-inv-line">
        {RSVP_FIELDS.map((field) => (
          <li key={field} className="py-4">
            {field === "attendance" ? (
              <Check checked onChange={() => undefined}>
                {RSVP_FIELD_LABELS[field]} <span className="text-inv-muted">— always included</span>
              </Check>
            ) : (
              <Check checked={state.rsvp.fields.includes(field)} onChange={() => toggle(field)}>
                {RSVP_FIELD_LABELS[field]}
              </Check>
            )}
          </li>
        ))}
      </ul>
      <Field
        className="mt-10"
        label="Reply by"
        optional
        type="date"
        value={state.rsvp.deadline}
        onChange={(v) => update((s) => ({ ...s, rsvp: { ...s.rsvp, deadline: v } }))}
        hint="We'll close replies at the end of this day."
      />
    </>
  );
}

async function readSheet(file: File): Promise<string[][]> {
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    const { readSheet: readXlsx } = await import("read-excel-file/browser");
    const rows = await readXlsx(file);
    return rows.map((row) => row.map((cell) => (cell == null ? "" : String(cell))));
  }
  return parseCsv(await file.text());
}

export function StepGuests({ state, update }: StepProps) {
  const [error, setError] = useState<string | null>(null);
  const g = state.guests;

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("This file is larger than 5 MB.");
    try {
      const preview = buildPreview(await readSheet(file), { names: [], contacts: [] });
      if (preview.missingName) return setError("We couldn't find a “name” column. The first row should contain: name, phone, email, allowedGuests.");
      const valid = preview.rows.filter((r) => !r.errors.length && !r.duplicate).slice(0, MAX_IMPORT_ROWS);
      update((s) => ({
        ...s,
        guests: {
          mode: "upload",
          rows: valid.map((r) => r.values),
          fileName: file.name,
          invalid: preview.rows.filter((r) => r.errors.length).length,
          duplicates: preview.rows.filter((r) => !r.errors.length && r.duplicate).length,
        },
      }));
    } catch {
      setError("This file couldn't be read. Please upload a .csv or .xlsx file.");
    }
  }

  const template = `data:text/csv;charset=utf-8,${encodeURIComponent("name,phone,email,allowedGuests\nNaz,+37491000000,naz@example.com,2\n")}`;

  return (
    <>
      <StepHeading eyebrow="Step nine" title="Guest list" text="Each guest will receive a personal link that greets them by name." />
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard name="guests" checked={g.mode === "upload"} onSelect={() => update((s) => ({ ...s, guests: { ...s.guests, mode: "upload" } }))} title="Upload my list" description="Excel or CSV." />
        <OptionCard name="guests" checked={g.mode === "later"} onSelect={() => update((s) => ({ ...s, guests: { ...s.guests, mode: "later" } }))} title="Skip for now" description="Send it to us later." />
      </div>
      {g.mode === "upload" && (
        <div className="mt-10">
          <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-inv-line px-6 py-10 text-center hover:border-inv-text has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
            <span className="font-serif text-xl">{g.fileName || "Choose a file"}</span>
            <span className="mt-2 text-xs text-inv-muted">Columns: name, phone, email, allowedGuests — only name is required.</span>
            <input type="file" accept=".csv,.xlsx,text/csv" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          <p className="mt-3 text-center">
            <a href={template} download="guest-list-template.csv" className="inv-link">
              Download a template
            </a>
          </p>
          {error && (
            <p role="alert" className="mt-4 text-center text-sm text-inv-accent">
              {error}
            </p>
          )}
          {g.rows.length > 0 && (
            <div className="mt-6 border border-inv-line p-5 text-center" role="status">
              <p className="font-serif text-2xl">{g.rows.length} guests ready</p>
              {(g.invalid > 0 || g.duplicates > 0) && (
                <p className="mt-2 text-sm text-inv-muted">
                  {g.invalid > 0 && `${g.invalid} rows without a valid name or contact were skipped. `}
                  {g.duplicates > 0 && `${g.duplicates} duplicates were removed.`}
                </p>
              )}
              <p className="mt-3 text-xs text-inv-muted">{g.rows.slice(0, 5).map((r) => r.name).join(", ")}{g.rows.length > 5 ? "…" : ""}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function StepNotes({ state, update }: StepProps) {
  return (
    <>
      <StepHeading eyebrow="Step ten" title="Anything else?" text="Inspiration, Pinterest boards, family details, special requests — anything that helps us." />
      <Field
        label="Is there anything else you would like us to know?"
        optional
        multiline
        rows={8}
        maxLength={4000}
        value={state.notes}
        onChange={(v) => update((s) => ({ ...s, notes: v }))}
        placeholder="https://pinterest.com/…"
      />
    </>
  );
}
