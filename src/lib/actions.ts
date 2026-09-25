/** Shape returned by every dashboard server action (consumed by <ActionForm>). */
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Changes on every submission so the form can react (reset, toast) even if the message repeats. */
  at?: number;
};

export const initialActionState: ActionState = {};

export function actionOk(message = "Saved"): ActionState {
  return { ok: true, message, at: Date.now() };
}

export function actionError(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors, at: Date.now() };
}
