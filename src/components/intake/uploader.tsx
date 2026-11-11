"use client";

import { useId, useRef, useState } from "react";
import { UPLOAD_MAX_MB, type UploadKind } from "@/lib/validation/intake";
import type { UploadedFile } from "./types";

/** `retry`: false when trying again can't help (the file is too large). */
type Pending = { key: string; name: string; progress: number; error?: string; retry?: boolean };

type UploaderProps = {
  kind: UploadKind;
  label: string;
  hint: string;
  max: number;
  draftKey: string;
  files: UploadedFile[];
  onAdd: (file: UploadedFile) => void;
  onRemove: (id: string) => void;
  accept?: string;
  audio?: boolean;
};

const MAX_BYTES = UPLOAD_MAX_MB * 1024 * 1024;

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function upload(draftKey: string, kind: UploadKind, file: File, onProgress: (p: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("draftKey", draftKey);
    form.append("kind", kind);
    form.append("file", file);
    xhr.open("POST", "/api/intake/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { ok: boolean; file?: UploadedFile; error?: string };
        if (body.ok && body.file) resolve(body.file);
        else reject(new Error(body.error || "The server couldn’t take this file."));
      } catch {
        reject(new Error("The server couldn’t take this file."));
      }
    };
    xhr.onerror = () => reject(new Error("The connection dropped. Check your internet and try again."));
    xhr.send(form);
  });
}

/**
 * Photo or song picker. Files upload as soon as they are chosen; each one shows
 * as done (a preview), uploading with a percentage, or failed with the reason,
 * "Try again" and "Remove". Too-large files are caught before they upload.
 */
export function Uploader({ kind, label, hint, max, draftKey, files, onAdd, onRemove, accept = "image/jpeg,image/png,image/webp,image/heic,image/avif", audio }: UploaderProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  // The chosen File objects, kept so a failed upload can be retried without picking it again.
  const sources = useRef(new Map<string, File>());
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const room = max - files.length - pending.length;
  const noun = audio ? "file" : "photo";

  const patch = (key: string, next: Partial<Pending>) => setPending((list) => list.map((x) => (x.key === key ? { ...x, ...next } : x)));

  const forget = (key: string) => {
    sources.current.delete(key);
    setPending((list) => list.filter((x) => x.key !== key));
  };

  async function send(key: string, file: File) {
    if (file.size > MAX_BYTES) {
      patch(key, { error: `It is ${formatSize(file.size)}, larger than ${UPLOAD_MAX_MB} MB. Choose a smaller copy.`, retry: false });
      return;
    }
    patch(key, { progress: 0, error: undefined });
    try {
      const uploaded = await upload(draftKey, kind, file, (progress) => patch(key, { progress }));
      onAdd(uploaded);
      forget(key);
    } catch (error) {
      patch(key, { error: error instanceof Error ? error.message : "The server couldn’t take this file.", retry: true });
    }
  }

  async function handle(list: FileList | null) {
    if (!list) return;
    const all = Array.from(list);
    const chosen = all.slice(0, Math.max(0, room));
    setSkipped(all.length - chosen.length);
    const entries = chosen.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file }));
    for (const { key, file } of entries) sources.current.set(key, file);
    setPending((p) => [...p, ...entries.map(({ key, file }) => ({ key, name: file.name, progress: 0 }))]);
    if (input.current) input.current.value = "";
    await Promise.all(entries.map(({ key, file }) => send(key, file)));
  }

  function retry(key: string) {
    const file = sources.current.get(key);
    if (file) void send(key, file);
    else forget(key);
  }

  async function remove(fileId: string) {
    onRemove(fileId);
    await fetch(`/api/intake/uploads?id=${encodeURIComponent(fileId)}&draftKey=${encodeURIComponent(draftKey)}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <div>
      <p className="inv-label" id={`${id}-label`}>
        {label}
        {max > 1 && (
          <span className="font-normal normal-case tracking-normal">
            {" "}
            · {files.length} of up to {max}
          </span>
        )}
      </p>

      {(files.length > 0 || room > 0) && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((file) =>
            audio ? (
              <div key={file.id} className="col-span-3 flex items-center gap-3 border border-inv-control p-3 sm:col-span-4">
                <audio controls preload="none" src={file.url} className="min-w-0 flex-1" />
                <button type="button" onClick={() => remove(file.id)} className="inv-link flex min-h-11 shrink-0 items-center">
                  Remove
                </button>
              </div>
            ) : (
              <figure key={file.id} className="group relative aspect-square overflow-hidden bg-inv-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- instant preview of the customer's own upload */}
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center"
                  aria-label={`Remove ${file.name}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-inv-bg/90 text-base text-inv-text shadow" aria-hidden="true">
                    ×
                  </span>
                </button>
              </figure>
            ),
          )}
          {room > 0 && (
            <label
              htmlFor={id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void handle(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center border border-dashed p-3 text-center text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 ${
                audio ? "col-span-3 min-h-24 sm:col-span-4" : "aspect-square"
              } ${dragging ? "border-inv-text bg-inv-surface" : "border-inv-control hover:border-inv-text"}`}
            >
              <span className="text-2xl font-light leading-none" aria-hidden="true">
                +
              </span>
              <span className="mt-2">{audio ? "Choose an audio file" : max > 1 ? "Add photos" : "Add photo"}</span>
              <input
                ref={input}
                id={id}
                type="file"
                accept={accept}
                multiple={max > 1}
                className="sr-only"
                aria-labelledby={`${id}-label`}
                onChange={(e) => void handle(e.target.files)}
              />
            </label>
          )}
        </div>
      )}

      {pending.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2" aria-label={`${label}: uploads in progress`}>
          {pending.map((p) =>
            p.error ? (
              <li key={p.key} className="border border-inv-accent px-4 py-3 text-sm" role="alert">
                <p className="leading-6">
                  <span className="break-all font-semibold">{p.name}</span> didn’t upload. {p.error}
                </p>
                <div className="mt-1 flex gap-5">
                  {p.retry && (
                    <button type="button" onClick={() => retry(p.key)} className="inv-link min-h-11 font-semibold">
                      Try again
                    </button>
                  )}
                  <button type="button" onClick={() => forget(p.key)} className="inv-link min-h-11">
                    Remove
                  </button>
                </div>
              </li>
            ) : (
              <li key={p.key} className="border border-inv-line px-4 py-3 text-sm">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-inv-muted" aria-hidden="true">
                    Uploading · {p.progress}%
                  </span>
                </p>
                <span
                  className="mt-2 block h-1 w-full bg-inv-line"
                  role="progressbar"
                  aria-valuenow={p.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Uploading ${p.name}`}
                >
                  <span className="block h-full bg-inv-text transition-[width]" style={{ width: `${p.progress}%` }} />
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      {skipped > 0 && (
        <p className="mt-2 text-sm text-inv-accent" role="status">
          {skipped === 1 ? `One ${noun} was left out` : `${skipped} ${noun}s were left out`}: this part holds up to {max}.
        </p>
      )}
      <p className="mt-2 text-[0.8125rem] leading-5 text-inv-muted">
        {hint} Up to {UPLOAD_MAX_MB} MB each.
      </p>
    </div>
  );
}
