"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, buttonClass, Card, CardHeader } from "@/components/ui/primitives";
import { buildPreview, CSV_TEMPLATE, parseCsv, type ExistingGuestKeys, type PreviewRow } from "@/lib/guests/import";
import { MAX_IMPORT_ROWS } from "@/lib/validation/guest";
import { importGuestsAction } from "@/server/actions/guests";

type Status = { tone: "error" | "success"; text: string } | null;

async function readSheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) {
    // Loaded on demand so the spreadsheet parser never weighs down other pages.
    const { readSheet: readXlsx } = await import("read-excel-file/browser");
    const rows = await readXlsx(file);
    return rows.map((row) => row.map((cell) => (cell == null ? "" : cell instanceof Date ? cell.toISOString() : String(cell))));
  }
  if (name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv") return parseCsv(await file.text());
  throw new Error("Please choose a .csv or .xlsx file.");
}

export function GuestImport({ eventId, existing }: { eventId: string; existing: ExistingGuestKeys }) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setStatus(null);
    setRows(null);
    if (!file) return;
    setFileName(file.name);
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ tone: "error", text: "This file is larger than 5 MB." });
      return;
    }
    try {
      const sheet = await readSheet(file);
      const preview = buildPreview(sheet, existing);
      if (preview.missingName) {
        setStatus({ tone: "error", text: "We couldn't find a “name” column. The first row must contain headers: name, phone, email, allowedGuests." });
        return;
      }
      if (preview.rows.length > MAX_IMPORT_ROWS) {
        setStatus({ tone: "error", text: `This file has ${preview.rows.length} rows — please import at most ${MAX_IMPORT_ROWS} at a time.` });
        return;
      }
      setRows(preview.rows);
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "The file couldn't be read." });
    }
  }

  const invalid = rows?.filter((r) => r.errors.length) ?? [];
  const duplicates = rows?.filter((r) => !r.errors.length && r.duplicate) ?? [];
  const importable = rows?.filter((r) => !r.errors.length && (!skipDuplicates || !r.duplicate)) ?? [];

  function confirmImport() {
    startTransition(async () => {
      const result = await importGuestsAction(eventId, importable.map((r) => r.values), skipDuplicates);
      if (result.ok) {
        setStatus({ tone: "success", text: result.message ?? "Imported" });
        setRows(null);
        setFileName(null);
        router.refresh();
      } else {
        setStatus({ tone: "error", text: result.message ?? "Import failed" });
      }
    });
  }

  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="1. Choose a file"
          description={
            <>
              CSV or Excel (.xlsx) with a header row: <code className="rounded bg-stone-100 px-1">name</code>,{" "}
              <code className="rounded bg-stone-100 px-1">phone</code>, <code className="rounded bg-stone-100 px-1">email</code>,{" "}
              <code className="rounded bg-stone-100 px-1">allowedGuests</code>. Only <em>name</em> is required.
            </>
          }
          action={
            <a href={templateHref} download="guests-template.csv" className={buttonClass("secondary", "sm")}>
              Download template
            </a>
          }
        />
        <label htmlFor="import-file" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 px-6 py-10 text-center hover:border-stone-400">
          <span className="font-medium">{fileName ?? "Select a file"}</span>
          <span className="mt-1 text-sm text-stone-500">Nothing is imported until you confirm the preview.</span>
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {status && (
          <p role={status.tone === "error" ? "alert" : "status"} className={`mt-3 text-sm ${status.tone === "error" ? "text-red-700" : "text-emerald-700"}`}>
            {status.text}{" "}
            {status.tone === "success" && (
              <Link href={`/admin/events/${eventId}/guests`} className="font-medium underline">
                View guests
              </Link>
            )}
          </p>
        )}
      </Card>

      {rows && (
        <Card>
          <CardHeader
            title="2. Review and confirm"
            description={`${rows.length} rows · ${importable.length} ready · ${invalid.length} with errors · ${duplicates.length} possible duplicates`}
          />
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} className="h-4 w-4 accent-espresso" />
            Skip possible duplicates (same name, phone or email)
          </label>
          <div className="max-h-[480px] overflow-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Row</th>
                  <th scope="col" className="px-3 py-2 font-medium">Name</th>
                  <th scope="col" className="px-3 py-2 font-medium">Phone</th>
                  <th scope="col" className="px-3 py-2 font-medium">Email</th>
                  <th scope="col" className="px-3 py-2 font-medium">Guests</th>
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => (
                  <tr key={row.line} className={row.errors.length ? "bg-red-50/60" : row.duplicate ? "bg-amber-50/60" : undefined}>
                    <td className="px-3 py-2 tabular-nums text-stone-500">{row.line}</td>
                    <td className="px-3 py-2">{row.values.name || <span className="text-stone-400">—</span>}</td>
                    <td className="px-3 py-2">{row.values.phone}</td>
                    <td className="px-3 py-2">{row.values.email}</td>
                    <td className="px-3 py-2 tabular-nums">{row.values.allowedGuests || 1}</td>
                    <td className="px-3 py-2">
                      {row.errors.length ? (
                        <span className="text-xs text-red-700">{row.errors.join("; ")}</span>
                      ) : row.duplicate ? (
                        <Badge tone="warning">{row.duplicate === "existing" ? "Already on your list" : "Repeated in file"}</Badge>
                      ) : (
                        <Badge tone="success">Ready</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => { setRows(null); setFileName(null); }}>
              Cancel
            </Button>
            <Button disabled={pending || importable.length === 0} onClick={confirmImport}>
              {pending ? "Importing…" : `Import ${importable.length} guest${importable.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
