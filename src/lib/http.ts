import "server-only";
import { NextResponse } from "next/server";

const MAX_JSON_BYTES = 16 * 1024;

/** Reads a small JSON body, rejecting oversized or malformed payloads. */
export async function readJson(request: Request): Promise<unknown | undefined> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return undefined;
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) return undefined;
  try {
    const text = await request.text();
    if (text.length > MAX_JSON_BYTES) return undefined;
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Blocks cross-site form posts: browsers always send Origin on POST fetches. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; still validated & rate limited
  try {
    return new URL(origin).host === new URL(request.url).host || origin === process.env.NEXT_PUBLIC_SITE_URL;
  } catch {
    return false;
  }
}

export function json(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
