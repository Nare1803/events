"use client";

import { useId, useState, type ReactNode } from "react";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";
import type { LocalizedText } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils/cn";
import { useFieldError } from "./action-form";

type FieldShellProps = { label: string; htmlFor: string; name: string; hint?: ReactNode; children: ReactNode; className?: string };

function FieldShell({ label, htmlFor, name, hint, children, className }: FieldShellProps) {
  const error = useFieldError(name);
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: ReactNode;
  required?: boolean;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
};

export function TextField({ name, label, defaultValue, type = "text", hint, className, multiline, rows, ...rest }: TextFieldProps) {
  const id = useId();
  const error = useFieldError(name);
  const common = {
    id,
    name,
    defaultValue: defaultValue ?? "",
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
    ...rest,
  };
  return (
    <FieldShell label={label} htmlFor={id} name={name} hint={hint} className={className}>
      {multiline ? <Textarea rows={rows ?? 3} {...common} /> : <Input type={type} {...common} />}
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
  hint,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} name={name} hint={hint} className={className}>
      <Select id={id} name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </FieldShell>
  );
}

/** Accessible switch built on a native checkbox (submits "on" when checked). */
export function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0">
        <span className="block text-sm font-medium text-stone-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-stone-500">{description}</span>}
      </label>
      <span className="relative inline-flex shrink-0">
        <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" role="switch" />
        <span
          className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-espresso peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </span>
    </div>
  );
}

/**
 * One input per enabled invitation language, shown as tabs. Submits
 * `${name}.hy`, `${name}.en`, `${name}.ru` — read with readLocalized() on the server.
 */
export function LocalizedField({
  name,
  label,
  value,
  locales,
  multiline,
  rows,
  hint,
  maxLength = 1000,
}: {
  name: string;
  label: string;
  value: LocalizedText;
  locales: Locale[];
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  maxLength?: number;
}) {
  const baseId = useId();
  const [active, setActive] = useState<Locale>(locales[0]);
  const error = useFieldError(name);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span id={`${baseId}-label`} className="text-sm font-medium text-stone-800">
          {label}
        </span>
        {locales.length > 1 && (
          <div role="tablist" aria-labelledby={`${baseId}-label`} className="inline-flex rounded-md bg-stone-100 p-0.5">
            {locales.map((locale) => (
              <button
                key={locale}
                type="button"
                role="tab"
                aria-selected={active === locale}
                aria-controls={`${baseId}-${locale}`}
                onClick={() => setActive(locale)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  active === locale ? "bg-white text-espresso shadow-xs" : "text-stone-500 hover:text-espresso",
                  !value[locale] && active !== locale && "italic",
                )}
              >
                {LOCALE_LABELS[locale].short}
              </button>
            ))}
          </div>
        )}
      </div>
      {locales.map((locale) => {
        const common = {
          id: `${baseId}-${locale}`,
          name: `${name}.${locale}`,
          defaultValue: value[locale] ?? "",
          lang: locale,
          maxLength,
          "aria-labelledby": `${baseId}-label`,
          "aria-invalid": !!error,
        };
        return (
          <div key={locale} role={locales.length > 1 ? "tabpanel" : undefined} hidden={active !== locale}>
            {multiline ? <Textarea rows={rows ?? 3} {...common} /> : <Input {...common} />}
          </div>
        );
      })}
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
