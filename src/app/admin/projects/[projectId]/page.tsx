import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/admin/action-button";
import { CopyButton } from "@/components/admin/copy-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { ActionForm, SubmitButton } from "@/components/forms/action-form";
import { SelectField, TextField } from "@/components/forms/fields";
import { Badge, buttonClass, Card, CardHeader } from "@/components/ui/primitives";
import { siteUrl } from "@/config/brand";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/locales";
import { projectChecklist } from "@/lib/projects/checklist";
import { MUSIC_CHOICE_LABELS, parseBrief, RSVP_FIELD_LABELS } from "@/lib/projects/intake";
import { isProjectStatus, PROJECT_STATUSES, STATUS_META } from "@/lib/projects/status";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/dates";
import { CONTACT_LABELS, CONTACT_METHODS } from "@/lib/validation/project";
import {
  archiveProjectAction,
  publishProjectAction,
  regenerateReviewLinkAction,
  resolveRevisionAction,
  sendForReviewAction,
  unpublishProjectAction,
  updateCustomerAction,
  updateProjectDetailsAction,
  updateProjectStatusAction,
} from "@/server/actions/projects";
import { eventTitle } from "@/server/queries/events";

const FILE_KIND_LABEL: Record<string, string> = { HERO: "Hero photo", GALLERY: "Gallery", ENGAGEMENT: "Engagement", DRESS_CODE: "Dress code reference", MUSIC: "Music" };

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireStaff();
  const { projectId } = await params;
  if (projectId.length > 64) notFound();
  const project = await db.invitationProject.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      event: true,
      package: true,
      template: true,
      assignedTo: { select: { name: true } },
      revisions: { orderBy: { createdAt: "desc" }, include: { resolvedBy: { select: { name: true } } } },
      files: { orderBy: [{ kind: "asc" }, { createdAt: "asc" }] },
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!project) notFound();

  const [checklist, packages, staff] = await Promise.all([
    projectChecklist(project.eventId),
    db.servicePackage.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "STAFF"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const brief = parseBrief(project.intake);
  const status = isProjectStatus(project.status) ? project.status : "NEW_REQUEST";
  const reviewUrl = `${siteUrl()}/review/${project.reviewToken}`;
  const liveUrl = `${siteUrl()}/${project.event.slug}`;
  const editor = `/admin/events/${project.eventId}`;
  const title = eventTitle(project.event);
  const tz = project.event.timezone;
  const openRevisions = project.revisions.filter((r) => r.status === "OPEN");
  const required = checklist.filter((c) => !c.optional);
  const readyCount = required.filter((c) => c.done).length;
  const phone = project.customer.phone?.replace(/[^\d]/g, "");
  const shareText = encodeURIComponent(
    status === "PUBLISHED" ? `Your invitation is live:\n${reviewUrl}` : `Your invitation preview is ready:\n${reviewUrl}`,
  );

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <Link href="/admin" className="text-sm text-stone-500 hover:text-espresso">
        ← Projects
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl">{title}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {project.reference} · {formatDateTime(project.event.eventDate, tz)} · {project.template?.name ?? "No template chosen"} ·{" "}
            {project.package?.name ?? "No package"} · requested {formatDateTime(project.createdAt, tz).split(",")[0]} via{" "}
            {project.source === "INTAKE" ? "order form" : "studio"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/${project.event.slug}?preview=1`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
            Full-screen preview
          </a>
          <Link href={`${editor}/invitation`} className={buttonClass("primary")}>
            Open editor
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          {/* Workflow */}
          <Card>
            <CardHeader title="Workflow" description={STATUS_META[status].hint} />
            <div className="flex flex-wrap items-start gap-3">
              {["NEW_REQUEST", "CONTENT_INCOMPLETE", "READY_FOR_DESIGN", "IN_DESIGN", "CHANGES_REQUESTED"].includes(status) && (
                <ActionButton
                  action={sendForReviewAction.bind(null, project.id)}
                  confirm={openRevisions.length ? `${openRevisions.length} change request(s) are still open. Send the preview anyway?` : undefined}
                >
                  Send preview to customer
                </ActionButton>
              )}
              {status === "APPROVED" && <ActionButton action={publishProjectAction.bind(null, project.id)}>Publish invitation</ActionButton>}
              {status === "READY_FOR_REVIEW" && (
                <ActionButton variant="secondary" action={publishProjectAction.bind(null, project.id)} confirm="The customer hasn't approved yet. Publish anyway?">
                  Publish without approval
                </ActionButton>
              )}
              {status === "PUBLISHED" && (
                <>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
                    Open live invitation
                  </a>
                  <ActionButton variant="secondary" action={unpublishProjectAction.bind(null, project.id)} confirm="Take the invitation offline? Guest links will stop working until you publish again.">
                    Take offline
                  </ActionButton>
                  <ActionButton variant="danger-ghost" action={archiveProjectAction.bind(null, project.id)} confirm="Archive this project? All invitation links will stop working.">
                    Archive
                  </ActionButton>
                </>
              )}
              {status === "ARCHIVED" && (
                <ActionButton variant="secondary" action={unpublishProjectAction.bind(null, project.id)}>
                  Restore to design
                </ActionButton>
              )}
            </div>

            <ActionForm action={updateProjectStatusAction.bind(null, project.id)} className="mt-5 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4" quiet>
              <SelectField
                name="status"
                label="Set status manually"
                defaultValue={status}
                className="w-64"
                options={PROJECT_STATUSES.filter((s) => s !== "PUBLISHED" && s !== "ARCHIVED").map((s) => ({ value: s, label: STATUS_META[s].label }))}
              />
              <SubmitButton variant="secondary">Update</SubmitButton>
            </ActionForm>
          </Card>

          {/* Customer link */}
          <Card>
            <CardHeader
              title={status === "PUBLISHED" ? "Couple portal" : "Private customer link"}
              description={
                status === "PUBLISHED"
                  ? "The couple's private page: final invitation link, personal guest links and live RSVP results."
                  : "The customer reviews and approves here. Until you send the preview, it shows “your invitation is being prepared”."
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-stone-100 px-3 py-2 text-xs">{reviewUrl}</code>
              <CopyButton value={reviewUrl} size="md" />
              <a href={`https://wa.me/${phone ?? ""}?text=${shareText}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
                WhatsApp
              </a>
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost")}>
                Open
              </a>
            </div>
            <div className="mt-3">
              <ActionButton
                size="sm"
                variant="ghost"
                action={regenerateReviewLinkAction.bind(null, project.id)}
                confirm="Replace the private link? The current link will stop working immediately."
              >
                Replace link
              </ActionButton>
            </div>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader
              title="Setup checklist"
              description={`${readyCount} of ${required.length} essentials ready`}
              action={
                <Link href={`${editor}/invitation`} className="text-sm font-medium underline underline-offset-4">
                  Edit invitation
                </Link>
              }
            />
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {checklist.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-stone-50">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                        item.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 text-transparent",
                      )}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="flex-1">
                      {item.label}
                      {item.optional && <span className="ml-1 text-xs text-stone-400">optional</span>}
                      <span className="sr-only">{item.done ? " — done" : " — to do"}</span>
                    </span>
                    {item.detail && <span className="text-xs text-stone-500">{item.detail}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Revisions */}
          <Card>
            <CardHeader
              title="Change requests"
              description={
                project.package?.includedRevisions != null
                  ? `${project.revisionCount} of ${project.package.includedRevisions} revision rounds used (${project.package.name})`
                  : `${project.revisionCount} revision round${project.revisionCount === 1 ? "" : "s"}`
              }
            />
            {project.revisions.length === 0 ? (
              <p className="text-sm text-stone-500">No change requests yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {project.revisions.map((r) => (
                  <li key={r.id} className={cn("rounded-lg border p-4", r.status === "OPEN" ? "border-red-200 bg-red-50/40" : "border-stone-200")}>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <Badge tone={r.status === "OPEN" ? "danger" : "success"}>{r.status === "OPEN" ? "Open" : "Done"}</Badge>
                      <span>Round {r.round}</span>
                      {!r.withinPackage && <Badge tone="warning">Beyond package</Badge>}
                      <span>· {formatDateTime(r.createdAt, tz)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm">{r.message}</p>
                    {r.status === "RESOLVED" ? (
                      <p className="mt-2 text-xs text-stone-500">
                        Done by {r.resolvedBy?.name ?? "staff"} {r.resolvedAt ? `on ${formatDateTime(r.resolvedAt, tz)}` : ""}
                        {r.staffNote ? ` — ${r.staffNote}` : ""}
                      </p>
                    ) : (
                      <ActionForm action={resolveRevisionAction.bind(null, project.id, r.id)} className="mt-3 flex flex-wrap items-end gap-2" quiet>
                        <TextField name="staffNote" label="Note (optional)" placeholder="What changed?" className="min-w-56 flex-1" maxLength={2000} />
                        <SubmitButton variant="secondary">Mark as done</SubmitButton>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Brief */}
          <Card>
            <CardHeader title="Customer brief" description="Exactly what the customer submitted." />
            <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <BriefItem label="Style">{brief.vibe?.length ? brief.vibe.join(", ") : "—"}</BriefItem>
              <BriefItem label="Languages">{brief.languages?.length ? brief.languages.map((l) => LOCALE_LABELS[l as keyof typeof LOCALE_LABELS]?.native ?? l).join(", ") : "—"}</BriefItem>
              <BriefItem label="Invitation text" wide>
                {brief.writeForMe ? <Badge tone="info">Write it for us</Badge> : null}
                {brief.welcomeText ? <p className="mt-1 whitespace-pre-line">{brief.welcomeText}</p> : !brief.writeForMe && "—"}
              </BriefItem>
              <BriefItem label="Music">
                {brief.music?.choice ? MUSIC_CHOICE_LABELS[brief.music.choice] : "—"}
                {brief.music?.reference && <p className="mt-1 text-stone-600">{brief.music.reference}</p>}
                {brief.music?.choice === "UPLOAD" && (
                  <p className="mt-1 text-xs text-stone-500">
                    Customer {brief.music.rightsConfirmedByCustomer ? "confirmed" : "did not confirm"} they may use this track. Verify before enabling.
                  </p>
                )}
              </BriefItem>
              <BriefItem label="RSVP questions">{brief.rsvpFields?.length ? brief.rsvpFields.map((f) => RSVP_FIELD_LABELS[f] ?? f).join(", ") : "—"}</BriefItem>
              <BriefItem label="Dress code">
                {brief.dressCode?.name || brief.dressCode?.description ? (
                  <>
                    {brief.dressCode.name}
                    {brief.dressCode.description && <p className="mt-1 text-stone-600">{brief.dressCode.description}</p>}
                    {brief.dressCode.colors?.length ? (
                      <span className="mt-2 flex gap-1.5">
                        {brief.dressCode.colors.map((c) => (
                          <span key={c} title={c} className="h-5 w-5 rounded-full ring-1 ring-stone-300" style={{ background: c }} />
                        ))}
                      </span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )}
              </BriefItem>
              <BriefItem label="Guest list">
                {brief.guestList?.provided ? `${brief.guestList.count ?? 0} guests imported` : brief.guestList?.later ? "Will send later" : "—"}
              </BriefItem>
              <BriefItem label="Notes" wide>
                {brief.notes ? <p className="whitespace-pre-line">{linkify(brief.notes)}</p> : "—"}
              </BriefItem>
            </dl>

            {project.files.length > 0 && (
              <div className="mt-6 border-t border-stone-100 pt-5">
                <p className="mb-3 text-sm font-medium">Files from the customer ({project.files.length})</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {project.files.map((file) => (
                    <figure key={file.id} className="text-xs">
                      {file.mimeType.startsWith("image/") ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square overflow-hidden rounded-lg bg-stone-100">
                          <Image src={file.url} alt={file.originalName} fill sizes="160px" className="object-cover" />
                        </a>
                      ) : (
                        <audio controls preload="none" src={file.url} className="w-full" />
                      )}
                      <figcaption className="mt-1 truncate text-stone-500" title={file.originalName}>
                        {FILE_KIND_LABEL[file.kind] ?? file.kind} · {file.originalName}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Customer" />
            <p className="font-medium">{project.customer.name}</p>
            <p className="mt-1 text-sm text-stone-600">
              {[project.customer.phone, project.customer.email].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Prefers {CONTACT_LABELS[project.customer.preferredContact as keyof typeof CONTACT_LABELS] ?? project.customer.preferredContact} ·{" "}
              {LOCALE_LABELS[project.customer.locale as keyof typeof LOCALE_LABELS]?.native ?? project.customer.locale}
            </p>
            <details className="mt-4 border-t border-stone-100 pt-3">
              <summary className="cursor-pointer text-sm font-medium text-stone-700">Edit customer</summary>
              <ActionForm action={updateCustomerAction.bind(null, project.id)} className="mt-3 flex flex-col gap-3">
                <TextField name="customerName" label="Name" defaultValue={project.customer.name} required />
                <TextField name="customerPhone" label="Phone" defaultValue={project.customer.phone} type="tel" />
                <TextField name="customerEmail" label="Email" defaultValue={project.customer.email} type="email" />
                <SelectField name="preferredContact" label="Preferred contact" defaultValue={project.customer.preferredContact} options={CONTACT_METHODS.map((m) => ({ value: m, label: CONTACT_LABELS[m] }))} />
                <SelectField name="customerLocale" label="Language" defaultValue={project.customer.locale} options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l].native }))} />
                <SubmitButton variant="secondary">Save customer</SubmitButton>
              </ActionForm>
            </details>
          </Card>

          <Card>
            <CardHeader title="Project" />
            <ActionForm action={updateProjectDetailsAction.bind(null, project.id)} className="flex flex-col gap-3">
              <SelectField name="packageId" label="Package" defaultValue={project.packageId ?? ""} options={[{ value: "", label: "Not decided" }, ...packages.map((p) => ({ value: p.id, label: p.name }))]} />
              <SelectField name="assignedToId" label="Assigned to" defaultValue={project.assignedToId ?? ""} options={[{ value: "", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} />
              <TextField name="internalNotes" label="Internal notes" defaultValue={project.internalNotes} multiline rows={4} maxLength={5000} hint="Never shown to the customer." />
              <SubmitButton variant="secondary">Save</SubmitButton>
            </ActionForm>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <ol className="flex flex-col gap-3 border-l border-stone-200 pl-4">
              {project.activities.map((a) => (
                <li key={a.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-stone-300" aria-hidden="true" />
                  <p>{a.message}</p>
                  <p className="text-xs text-stone-500">
                    {a.actor} · {formatDateTime(a.createdAt, tz)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </main>
  );
}

function BriefItem({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="mt-1 text-stone-800">{children}</dd>
    </div>
  );
}

/** Renders http(s) links in customer notes as safe, external links. */
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
