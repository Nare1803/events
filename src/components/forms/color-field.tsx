"use client";

import { useId, useState } from "react";
import { Input, Label } from "@/components/ui/primitives";
import { useFieldError } from "./action-form";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Hex text input kept in sync with a native colour picker. Submits the text value (may be empty). */
export function ColorField({ name, label, defaultValue, placeholder = "#BBAA9D" }: { name: string; label: string; defaultValue?: string | null; placeholder?: string }) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const error = useFieldError(name);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX.test(value) ? value : placeholder}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-stone-300 bg-white p-1"
        />
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={7}
          aria-invalid={!!error}
          className="font-mono uppercase"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
