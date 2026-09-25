import type { Locale } from "@/lib/i18n/locales";
import type { MusicChoice } from "@/lib/projects/intake";
import type { ImportRow } from "@/lib/validation/guest";
import type { UploadKind } from "@/lib/validation/intake";
import type { ContactMethod } from "@/lib/validation/project";
import type { EventType } from "@/lib/validation/enums";

export type UploadedFile = { id: string; kind: UploadKind; url: string; name: string; width?: number; height?: number };

export type ScheduleRow = { key: string; time: string; title: string; venue: string; address: string; notes: string };

/** Client-side order form state (persisted to localStorage while filling in). */
export type IntakeState = {
  version: 1;
  draftKey: string;
  step: number;
  visited: number;
  event: { type: EventType; partnerOne: string; partnerTwo: string; date: string; locale: Locale; extraLocales: Locale[] };
  templateKey: string;
  story: { writeForMe: boolean; welcomeText: string; vibe: string[] };
  files: UploadedFile[];
  music: { choice: MusicChoice; reference: string; rightsConfirmed: boolean };
  schedule: ScheduleRow[];
  dressCode: { enabled: boolean; name: string; description: string; colors: string[] };
  rsvp: { fields: string[]; deadline: string };
  guests: { mode: "upload" | "later" | "none"; rows: ImportRow[]; fileName: string; invalid: number; duplicates: number };
  notes: string;
  contact: { name: string; email: string; phone: string; preferredContact: ContactMethod };
  packageKey: string;
  consent: boolean;
};

export type TemplateOption = { key: string; name: string; description: string; available: boolean; tokens: import("@/lib/themes").ThemeTokens; heroVariant: string };
export type PackageOption = { key: string; name: string; tagline: string; features: string[]; price: string | null; isDefault: boolean };

export type StepProps = {
  state: IntakeState;
  update: (patch: (draft: IntakeState) => IntakeState) => void;
  errors: Record<string, string>;
};
