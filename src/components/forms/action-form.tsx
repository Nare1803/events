"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
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
  /**
   * Long editor forms: once something changes, a bar sticks to the bottom with
   * "Unsaved changes · Save", and leaving the page asks first.
   */
  guard?: boolean;
};

const LEAVE_MESSAGE = "You have unsaved changes. Leave this page without saving?";

/** Warns before a reload, a tab close or an in-app link would drop unsaved changes. */
function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    // Client-side navigation never fires beforeunload, so in-app links are checked here
    // (capture phase, before Next.js handles the click).
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);
}

/**
 * Wrapper around a server action: inline status, field errors for <Field>,
 * and a pending flag for <SubmitButton>. Submits through onSubmit so React's
 * automatic form reset never wipes what the user typed when validation fails.
 */
export function ActionForm({ action, children, className, resetOnSuccess, onSuccess, quiet, confirm, guard }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(state.at);
  useLeaveGuard(!!guard && dirty);

  // A successful save clears the unsaved state (adjusted during render, not in an effect).
  if (state.at !== savedAt) {
    setSavedAt(state.at);
    if (state.ok) setDirty(false);
  }

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
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onInput={guard ? () => setDirty(true) : undefined}
        onChange={guard ? () => setDirty(true) : undefined}
        className={className}
        noValidate
      >
        {children}
        {guard && dirty && (
          <div
            role="status"
            className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border border-stone-300 bg-white/95 py-2.5 pl-4 pr-2.5 shadow-lg backdrop-blur"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-espresso">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              Unsaved changes
            </span>
            <SubmitButton>Save</SubmitButton>
          </div>
        )}
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
