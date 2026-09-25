"use client";

import { useId, useRef, useState } from "react";
import type { UploadKind } from "@/lib/validation/intake";
import type { UploadedFile } from "./types";

type Pending = { key: string; name: string; progress: number; error?: string };

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
        else reject(new Error(body.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Connection problem — please try again."));
    xhr.send(form);
  });
}

/** Drop zone with per-file progress, previews and removal. Files upload immediately. */
export function Uploader({ kind, label, hint, max, draftKey, files, onAdd, onRemove, accept = "image/jpeg,image/png,image/webp,image/heic,image/avif", audio }: UploaderProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const room = max - files.length - pending.filter((p) => !p.error).length;

  async function handle(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list).slice(0, Math.max(0, room));
    await Promise.all(
      chosen.map(async (file) => {
        const key = `${file.name}-${file.size}-${Math.random()}`;
        setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
        try {
          const uploaded = await upload(draftKey, kind, file, (progress) =>
            setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
          );
          onAdd(uploaded);
          setPending((p) => p.filter((x) => x.key !== key));
        } catch (error) {
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: error instanceof Error ? error.message : "Upload failed" } : x)));
        }
      }),
    );
    if (input.current) input.current.value = "";
  }

  async function remove(fileId: string) {
    onRemove(fileId);
    await fetch(`/api/intake/uploads?id=${encodeURIComponent(fileId)}&draftKey=${encodeURIComponent(draftKey)}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <div>
      <p className="inv-eyebrow text-[0.625rem] text-inv-muted" id={`${id}-label`}>
        {label}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {files.map((file) =>
          audio ? (
            <div key={file.id} className="col-span-3 flex items-center gap-3 border border-inv-line p-3 sm:col-span-4">
              <audio controls preload="none" src={file.url} className="min-w-0 flex-1" />
              <button type="button" onClick={() => remove(file.id)} className="inv-link shrink-0">
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
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-inv-bg/90 text-sm text-inv-text shadow"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </figure>
          ),
        )}
        {pending.map((p) => (
          <div key={p.key} className="relative col-span-1 flex aspect-square flex-col justify-end overflow-hidden border border-inv-line p-2 text-[10px]">
            <span className="truncate">{p.name}</span>
            {p.error ? (
              <span className="mt-1 text-inv-accent" role="alert">
                {p.error}{" "}
                <button type="button" className="underline" onClick={() => setPending((list) => list.filter((x) => x.key !== p.key))}>
                  OK
                </button>
              </span>
            ) : (
              <span className="mt-1 block h-1 w-full bg-inv-line" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${p.name}`}>
                <span className="block h-full bg-inv-text transition-[width]" style={{ width: `${p.progress}%` }} />
              </span>
            )}
          </div>
        ))}
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
            className={`flex cursor-pointer flex-col items-center justify-center border border-dashed p-3 text-center text-xs transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 ${
              audio ? "col-span-3 min-h-24 sm:col-span-4" : "aspect-square"
            } ${dragging ? "border-inv-text bg-inv-surface" : "border-inv-line hover:border-inv-text"}`}
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
      <p className="mt-2 text-xs text-inv-muted">{hint}</p>
    </div>
  );
}
