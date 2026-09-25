"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { initialActionState, type ActionState } from "@/lib/actions";
import { notifySaved } from "@/lib/client-events";
import { buttonClass, type ButtonVariant } from "@/components/ui/primitives";
import { cn } from "@/lib/utils/cn";

type FormContextValue = { errors: Record<string, string>; pending: boolean };
const FormContext = createContext<FormContextValue>({ errors: {}, pending: false });

export function useFieldError(name: string): string | undefined {
  return useContext(FormContext).errors[name];
}

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  /** Clear the form after a successful submission (e.g. "add item" forms). */
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  /** Hide the inline status line (useful for tiny inline forms). */
  quiet?: boolean;
  /** Ask for confirmation before submitting (destructive actions). */
  confirm?: string;
};

/**
 * Wrapper around a server action: inline status, field errors for <Field>,
 * and a pending flag for <SubmitButton>. Submits through onSubmit so React's
 * automatic form reset never wipes what the user typed when validation fails.
 */
export function ActionForm({ action, children, className, resetOnSuccess, onSuccess, quiet, confirm }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!state.at || !state.ok) return;
    if (resetOnSuccess) formRef.current?.reset();
    notifySaved();
    onSuccessRef.current?.();
  }, [state.at, state.ok, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (confirm && !window.confirm(confirm)) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <FormContext.Provider value={{ errors: state.errors ?? {}, pending }}>
      <form ref={formRef} onSubmit={onSubmit} className={className} noValidate>
        {children}
        {!quiet && (
          <p aria-live="polite" className={cn("mt-3 min-h-5 text-sm", state.ok ? "text-emerald-700" : "text-red-700")}>
            {state.message}
          </p>
        )}
        {quiet && state.ok === false && state.message && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {state.message}
          </p>
        )}
      </form>
    </FormContext.Provider>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  pendingLabel = "Saving…",
  className,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useContext(FormContext);
  return (
    <button type="submit" disabled={pending} className={cn(buttonClass(variant, size), className)} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
