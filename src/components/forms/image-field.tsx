"use client";

import { useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/primitives";
import { useFieldError } from "./action-form";

type ImageFieldProps = {
  /** Submits `${name}File` (new upload) and `${name}Remove` (clear). */
  name: string;
  label: string;
  current: string | null;
  hint?: string;
  aspect?: string;
};

export function ImageField({ name, label, current, hint, aspect = "4 / 3" }: ImageFieldProps) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const error = useFieldError(`${name}File`);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (remove ? null : current);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-36 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100" style={{ aspectRatio: aspect }}>
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of an unsaved upload / small thumbnail
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-stone-400">No image</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          <input
            id={id}
            name={`${name}File`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
            className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-stone-200"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
              if (file) setRemove(false);
            }}
          />
          {current && !preview && (
            <label className="flex items-center gap-2 text-stone-600">
              <input type="checkbox" name={`${name}Remove`} checked={remove} onChange={(e) => setRemove(e.target.checked)} className="h-4 w-4 accent-espresso" />
              Remove image
            </label>
          )}
          <p className="text-xs text-stone-500">{hint ?? "JPEG, PNG, WebP or HEIC up to 12 MB. Location data is removed automatically."}</p>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
