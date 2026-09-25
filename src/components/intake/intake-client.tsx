"use client";

import dynamic from "next/dynamic";
import type { PackageOption, TemplateOption } from "./types";

/**
 * The wizard restores drafts from localStorage, so it renders on the client
 * only — this avoids any hydration mismatch between saved and default answers.
 */
const Wizard = dynamic(() => import("./intake-wizard").then((m) => m.IntakeWizard), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-ivory" role="status">
      <span className="sr-only">Loading…</span>
      <span className="animate-pulse font-serif text-4xl italic text-taupe" aria-hidden="true">
        O
      </span>
    </div>
  ),
});

export function IntakeClient(props: { templates: TemplateOption[]; packages: PackageOption[]; wantedTemplate?: string; wantedPackage?: string }) {
  return <Wizard {...props} />;
}
