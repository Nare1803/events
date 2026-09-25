"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/* Editorial form controls for the customer order form (styled by the invitation tokens). */

export function StepHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: ReactNode }) {
  return (
    <div className="mb-12 text-center">
      <p className="inv-eyebrow text-inv-accent">{eyebrow}</p>
      <h2 className="inv-display mt-4 text-[2.5rem] sm:text-5xl" tabIndex={-1} data-step-heading>
        {title}
      </h2>
      {text && <p className="mx-auto mt-5 max-w-md leading-7 text-inv-muted">{text}</p>}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  className?: string;
};

export function Field({ label, value, onChange, error, hint, optional, type = "text", multiline, rows = 4, maxLength = 200, placeholder, autoComplete, inputMode, className }: FieldProps) {
  const id = useId();
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    maxLength,
    placeholder,
    autoComplete,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="inv-eyebrow flex items-baseline justify-between gap-3 text-[0.625rem] text-inv-muted">
        <span>{label}</span>
        {optional && <span className="normal-case tracking-normal opacity-70">Optional</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={rows} className="inv-field min-h-28 resize-y leading-7" />
      ) : (
        <input {...common} type={type} inputMode={inputMode} className="inv-field" />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-inv-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-inv-accent">
          {error}
        </p>
      )}
    </div>
  );
}

/** Selectable pill (multi- or single-select). */
export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-5 text-sm transition-colors duration-300",
        selected ? "border-inv-text bg-inv-text text-inv-bg" : "border-inv-line hover:border-inv-text",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/** Large radio option with title + description. */
export function OptionCard({
  name,
  checked,
  onSelect,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 border px-5 py-4 transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        checked ? "border-inv-text bg-inv-text text-inv-bg" : "border-inv-line hover:border-inv-text",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span className={cn("mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", checked ? "border-inv-bg" : "border-inv-muted")} aria-hidden="true">
        {checked && <span className="h-2 w-2 rounded-full bg-inv-bg" />}
      </span>
      <span>
        <span className="block font-serif text-lg leading-snug">{title}</span>
        {description && <span className={cn("mt-1 block text-sm", checked ? "opacity-80" : "text-inv-muted")}>{description}</span>}
      </span>
    </label>
  );
}

export function Check({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-6">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--inv-text)]"
          aria-invalid={!!error}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1 pl-7 text-xs text-inv-accent">
          {error}
        </p>
      )}
    </div>
  );
}
