import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Local-disk storage driver. Files live in ./storage/uploads (outside /public,
 * because Next.js only serves public files that existed at build time) and are
 * served by src/app/uploads/[...path]/route.ts.
 *
 * For serverless hosting swap this module for an S3/R2/Supabase Storage driver
 * with the same exported functions — callers only use the returned public URL.
 */
export const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
export const UPLOAD_URL_PREFIX = "/uploads/";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]);
const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
};

export class UploadError extends Error {}

export type StoredImage = { url: string; width: number; height: number; placeholder: string };

function fileName(ext: string) {
  return `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
}

async function save(folder: string, name: string, data: Buffer): Promise<string> {
  if (!/^[a-z0-9]+$/i.test(folder)) throw new UploadError("Invalid folder");
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ path.join(dir, name), data);
  return `${UPLOAD_URL_PREFIX}${folder}/${name}`;
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && value.size > 0;
}

/**
 * Normalises an uploaded photo: auto-rotates, caps the long edge at 2400px,
 * re-encodes to WebP and strips all metadata (EXIF GPS location included).
 */
export async function storeImage(folder: string, file: File, maxEdge = 2400): Promise<StoredImage> {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 12 MB or smaller.");
  if (file.type && !IMAGE_TYPES.has(file.type)) throw new UploadError("Please upload a JPEG, PNG, WebP or AVIF image.");
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new UploadError("This file doesn't look like a valid image.");
    });
  const tiny = await sharp(data).resize(16).webp({ quality: 40 }).toBuffer();
  const url = await save(folder, fileName("webp"), data);
  return { url, width: info.width, height: info.height, placeholder: `data:image/webp;base64,${tiny.toString("base64")}` };
}

export async function storeAudio(folder: string, file: File): Promise<string> {
  if (file.size > MAX_AUDIO_BYTES) throw new UploadError("Audio files must be 12 MB or smaller.");
  const ext = AUDIO_TYPES[file.type];
  if (!ext) throw new UploadError("Please upload an MP3, M4A, AAC, OGG or WAV file.");
  return save(folder, fileName(ext), Buffer.from(await file.arrayBuffer()));
}

/** Deletes a previously uploaded file. Demo assets and foreign URLs are ignored. */
export async function removeUpload(url: string | null | undefined): Promise<void> {
  const target = resolveUploadPath(url);
  if (target) await unlink(/*turbopackIgnore: true*/ target).catch(() => undefined);
}

/** Maps a public /uploads URL to a file path, refusing anything outside UPLOAD_ROOT. */
export function resolveUploadPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return null;
  const relative = url.slice(UPLOAD_URL_PREFIX.length);
  if (!/^[a-z0-9]+\/[a-z0-9-]+\.(webp|mp3|m4a|aac|ogg|wav|webm)$/i.test(relative)) return null;
  const resolved = path.resolve(UPLOAD_ROOT, relative);
  return resolved.startsWith(UPLOAD_ROOT + path.sep) ? resolved : null;
}

export async function readUpload(url: string): Promise<Buffer | null> {
  const target = resolveUploadPath(url);
  return target ? readFile(/*turbopackIgnore: true*/ target).catch(() => null) : null;
}
