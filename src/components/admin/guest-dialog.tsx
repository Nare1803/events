"use client";

import { useEffect, useRef } from "react";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/actions";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";
import type { GuestRow } from "./guest-types";

type GuestDialogProps = {
  open: boolean;
  onClose: () => void;
  guest: GuestRow | null;
  locales: Locale[];
  defaultAllowed: number;
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
};

/** Add / edit guest in a native modal dialog (focus trap + Esc handled by the browser). */
export function GuestDialog({ open, onClose, guest, locales, defaultAllowed, action }: GuestDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="guest-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-stone-200 p-0 text-espresso shadow-xl backdrop:bg-espresso/40"
    >
      {open && (
        <ActionForm key={guest?.id ?? "new"} action={action} onSuccess={onClose} className="p-6">
          <h2 id="guest-dialog-title" className="text-lg font-semibold">
            {guest ? "Edit guest" : "Add guest"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={guest?.name} required maxLength={120} className="sm:col-span-2" />
            <TextField name="phone" label="Phone" type="tel" defaultValue={guest?.phone} autoComplete="off" />
            <TextField name="email" label="Email" type="email" defaultValue={guest?.email} autoComplete="off" />
            <TextField
              name="allowedGuests"
              label="Allowed guests"
              type="number"
              min={1}
              max={20}
              defaultValue={guest?.allowedGuests ?? defaultAllowed}
              hint="Party size including this guest."
            />
            <SelectField
              name="locale"
              label="Language"
              defaultValue={guest?.locale ?? ""}
              options={[{ value: "", label: "Event default" }, ...locales.map((l) => ({ value: l, label: LOCALE_LABELS[l].native }))]}
            />
            <TextField
              name="slug"
              label="Personal link"
              defaultValue={guest?.slug}
              placeholder="Generated automatically"
              hint="The part after the event address, e.g. naz-k3f9."
              className="sm:col-span-2"
            />
            <TextField name="notes" label="Private notes" defaultValue={guest?.notes} multiline rows={2} maxLength={1000} hint="Only visible to you." className="sm:col-span-2" />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton>{guest ? "Save guest" : "Add guest"}</SubmitButton>
          </div>
        </ActionForm>
      )}
    </dialog>
  );
}
