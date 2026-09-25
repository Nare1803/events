"use client";

import { startTransition, useActionState, useId, useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { interpolate } from "@/lib/i18n/format";
import { initialActionState, type ActionState } from "@/lib/actions";
import { approveInvitationAction, requestChangesAction } from "@/server/actions/review";

type Revision = { id: string; message: string; open: boolean; date: string };

type ReviewPanelProps = {
  token: string;
  status: "READY_FOR_REVIEW" | "CHANGES_REQUESTED" | "APPROVED";
  revisions: Revision[];
  revisionsLeft: number | null;
  t: Dictionary["review"];
  errors: Dictionary["rsvp"]["errors"];
};

/** Approve / request changes — shown to the customer below their private preview. */
export function ReviewPanel({ token, status: initialStatus, revisions, revisionsLeft, t, errors }: ReviewPanelProps) {
  const fieldId = useId();
  const [status, setStatus] = useState(initialStatus);
  const [writing, setWriting] = useState(false);
  const [approving, startApprove] = useTransition();
  const [approveError, setApproveError] = useState<string | null>(null);
  const [changeState, sendChanges, sending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await requestChangesAction(token, prev, fd);
    if (result.ok) {
      setStatus("CHANGES_REQUESTED");
      setWriting(false);
    }
    return result;
  }, initialActionState);

  const errorText = (code?: string) =>
    code === "RATE_LIMITED" ? errors.rateLimited : code === "TOO_SHORT" ? t.tooShort : code ? errors.generic : null;

  const approve = () => {
    if (!window.confirm(t.confirmApprove)) return;
    startApprove(async () => {
      const result = await approveInvitationAction(token);
      if (result.ok) setStatus("APPROVED");
      else setApproveError(errorText(result.message));
    });
  };

  return (
    <section aria-labelledby={`${fieldId}-title`} className="bg-inv-bg px-6 py-20 text-center text-inv-text sm:py-28">
      <div className="mx-auto max-w-xl">
        <p className="inv-eyebrow text-inv-accent">{t.privatePreview}</p>

        {status === "APPROVED" ? (
          <>
            <h2 id={`${fieldId}-title`} className="inv-display mt-6 text-4xl italic sm:text-5xl">
              {t.approvedTitle}
            </h2>
            <p className="mt-6 leading-8 text-inv-muted">{t.approvedText}</p>
          </>
        ) : status === "CHANGES_REQUESTED" && !writing ? (
          <>
            <h2 id={`${fieldId}-title`} className="inv-display mt-6 text-4xl italic sm:text-5xl">
              {t.changesReceivedTitle}
            </h2>
            <p className="mt-6 leading-8 text-inv-muted">{t.changesReceivedText}</p>
            <button type="button" onClick={() => setWriting(true)} className="inv-link mt-6">
              {t.requestChanges}
            </button>
          </>
        ) : (
          <>
            <h2 id={`${fieldId}-title`} className="inv-display mt-6 text-4xl sm:text-5xl">
              {t.decisionTitle}
            </h2>
            <p className="mt-6 leading-8 text-inv-muted">{t.decisionText}</p>

            {!writing && (
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={approve}
                  disabled={approving}
                  className="inv-button inv-button-solid w-full sm:w-auto"
                >
                  {t.approve}
                </button>
                <button type="button" onClick={() => setWriting(true)} className="inv-button w-full sm:w-auto">
                  {t.requestChanges}
                </button>
              </div>
            )}
            {approveError && (
              <p role="alert" className="mt-4 text-sm text-inv-accent">
                {approveError}
              </p>
            )}
          </>
        )}

        {writing && status !== "APPROVED" && (
          <form
            className="mt-10 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(() => sendChanges(fd));
            }}
          >
            <label htmlFor={fieldId} className="inv-eyebrow block text-[0.625rem] text-inv-muted">
              {t.changesLabel}
            </label>
            <textarea
              id={fieldId}
              name="message"
              required
              minLength={3}
              maxLength={4000}
              rows={5}
              className="inv-field mt-2 min-h-36 resize-y leading-7"
              aria-describedby={`${fieldId}-hint`}
              autoFocus
            />
            <p id={`${fieldId}-hint`} className="mt-2 text-xs text-inv-muted">
              {t.changesHint}
            </p>
            {changeState.ok === false && (
              <p role="alert" className="mt-3 text-sm text-inv-accent">
                {errorText(changeState.message)}
              </p>
            )}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button type="submit" disabled={sending} className="inv-button w-full sm:w-auto">
                {sending ? "…" : t.sendChanges}
              </button>
              <button type="button" onClick={() => setWriting(false)} className="inv-link">
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {revisionsLeft != null && status !== "APPROVED" && (
          <p className="mt-10 text-xs text-inv-muted">
            {revisionsLeft > 0 ? interpolate(t.revisionsLeft, { count: revisionsLeft }) : t.noRevisionsLeft}
          </p>
        )}

        {revisions.length > 0 && (
          <div className="mt-14 border-t border-inv-line pt-10 text-left">
            <p className="inv-eyebrow text-center text-[0.625rem] text-inv-muted">{t.yourRequests}</p>
            <ul className="mt-6 flex flex-col gap-5">
              {revisions.map((r) => (
                <li key={r.id} className="border-l border-inv-line pl-4">
                  <p className="whitespace-pre-line text-sm leading-7">{r.message}</p>
                  <p className="mt-1 text-xs text-inv-muted">
                    {r.date} · {r.open ? t.requestOpen : t.requestDone}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
