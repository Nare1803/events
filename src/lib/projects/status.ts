/** Workflow of an invitation project — ORÉ is a done-for-you service. */
export const PROJECT_STATUSES = [
  "NEW_REQUEST",
  "CONTENT_INCOMPLETE",
  "READY_FOR_DESIGN",
  "IN_DESIGN",
  "READY_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && (PROJECT_STATUSES as readonly string[]).includes(value);
}

type Tone = "neutral" | "success" | "danger" | "warning" | "info";

export const STATUS_META: Record<ProjectStatus, { label: string; tone: Tone; hint: string }> = {
  NEW_REQUEST: { label: "New request", tone: "info", hint: "Submitted by the customer — review the brief." },
  CONTENT_INCOMPLETE: { label: "Waiting for content", tone: "warning", hint: "We asked the customer for missing photos or details." },
  READY_FOR_DESIGN: { label: "Ready for design", tone: "info", hint: "Everything is in — the invitation can be prepared." },
  IN_DESIGN: { label: "In design", tone: "neutral", hint: "The studio is preparing the invitation." },
  READY_FOR_REVIEW: { label: "Waiting for approval", tone: "warning", hint: "Preview sent — waiting for the customer." },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "danger", hint: "The customer asked for changes." },
  APPROVED: { label: "Approved", tone: "success", hint: "Approved by the customer — ready to publish." },
  PUBLISHED: { label: "Published", tone: "success", hint: "Live — guests can open their invitations." },
  ARCHIVED: { label: "Archived", tone: "neutral", hint: "Closed. The invitation link no longer works." },
};

/** Groups shown as pipeline counters on the studio home. */
export const PIPELINE_GROUPS: { key: string; label: string; statuses: ProjectStatus[] }[] = [
  { key: "new", label: "New requests", statuses: ["NEW_REQUEST"] },
  { key: "content", label: "Waiting for content", statuses: ["CONTENT_INCOMPLETE"] },
  { key: "design", label: "In design", statuses: ["READY_FOR_DESIGN", "IN_DESIGN", "CHANGES_REQUESTED"] },
  { key: "approval", label: "Waiting for approval", statuses: ["READY_FOR_REVIEW"] },
  { key: "approved", label: "Approved", statuses: ["APPROVED"] },
  { key: "published", label: "Published", statuses: ["PUBLISHED"] },
];

/** Statuses in which the customer may see the preview on their private link. */
export const REVIEWABLE: ProjectStatus[] = ["READY_FOR_REVIEW", "CHANGES_REQUESTED", "APPROVED"];
