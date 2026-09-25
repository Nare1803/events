import { db } from "@/lib/db";
import { isSameOrigin, json } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isUploadFile, removeUpload, storeAudio, storeImage, UploadError } from "@/lib/storage";
import { DRAFT_KEY_PATTERN, UPLOAD_KINDS, UPLOAD_LIMITS, type UploadKind } from "@/lib/validation/intake";

const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FILES_PER_DRAFT = 40;

/** Storage folder for a draft (alphanumeric only). */
const draftFolder = (draftKey: string) => `intake${draftKey.replace(/[^A-Za-z0-9]/g, "").slice(0, 24)}`;

/** Deletes abandoned uploads from order forms that were never submitted. */
async function purgeStaleUploads() {
  const stale = await db.projectFile.findMany({
    where: { projectId: null, createdAt: { lt: new Date(Date.now() - PENDING_TTL_MS) } },
    select: { id: true, url: true },
    take: 50,
  });
  if (!stale.length) return;
  await Promise.all(stale.map((f) => removeUpload(f.url)));
  await db.projectFile.deleteMany({ where: { id: { in: stale.map((f) => f.id) } } });
}

/** Order-form upload: one file per request so the browser can show per-file progress. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, error: "Forbidden" }, 403);
  if (!rateLimit(`upload:${clientKey(request.headers)}`, 80, 60 * 60 * 1000).ok) {
    return json({ ok: false, error: "Too many uploads. Please wait a little and try again." }, 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "The upload could not be read." }, 400);
  }
  const draftKey = form.get("draftKey");
  const kind = form.get("kind");
  const file = form.get("file");
  if (typeof draftKey !== "string" || !DRAFT_KEY_PATTERN.test(draftKey)) return json({ ok: false, error: "Invalid form session." }, 400);
  if (typeof kind !== "string" || !(UPLOAD_KINDS as readonly string[]).includes(kind)) return json({ ok: false, error: "Invalid upload type." }, 400);
  if (!isUploadFile(file)) return json({ ok: false, error: "Please choose a file." }, 400);
  const uploadKind = kind as UploadKind;

  const [total, ofKind] = await Promise.all([
    db.projectFile.count({ where: { draftKey, projectId: null } }),
    db.projectFile.count({ where: { draftKey, projectId: null, kind: uploadKind } }),
  ]);
  if (total >= MAX_FILES_PER_DRAFT || ofKind >= UPLOAD_LIMITS[uploadKind]) {
    return json({ ok: false, error: "You've reached the maximum number of files for this section." }, 409);
  }

  try {
    const folder = draftFolder(draftKey);
    const common = { draftKey, kind: uploadKind, originalName: file.name.slice(0, 200) || "file", size: file.size };
    const row =
      uploadKind === "MUSIC"
        ? await db.projectFile.create({ data: { ...common, url: await storeAudio(folder, file), mimeType: file.type || "audio/mpeg" } })
        : await (async () => {
            const image = await storeImage(folder, file);
            return db.projectFile.create({
              data: { ...common, url: image.url, mimeType: "image/webp", width: image.width, height: image.height, placeholder: image.placeholder },
            });
          })();
    void purgeStaleUploads().catch(() => undefined);
    return json({ ok: true, file: { id: row.id, kind: row.kind, url: row.url, name: row.originalName, width: row.width, height: row.height } });
  } catch (error) {
    if (error instanceof UploadError) return json({ ok: false, error: error.message }, 422);
    return json({ ok: false, error: "The upload failed. Please try again." }, 500);
  }
}

/** Removes a pending upload (only from the same, unsubmitted draft). */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false }, 403);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const draftKey = url.searchParams.get("draftKey") ?? "";
  if (!DRAFT_KEY_PATTERN.test(draftKey) || id.length > 40) return json({ ok: false }, 400);
  const file = await db.projectFile.findFirst({ where: { id, draftKey, projectId: null } });
  if (!file) return json({ ok: false }, 404);
  await db.projectFile.delete({ where: { id: file.id } });
  await removeUpload(file.url);
  return json({ ok: true });
}
