"use client";

import type {
  GeocodeResult,
  KundliRequest,
  KundliResponse,
  ApiError,
} from "./types";

const STORAGE_KEY = "astrochakra:lastKundli";

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    if (body?.error) return body.error;
  } catch {
    /* fall through */
  }
  return `Request failed (${res.status})`;
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as GeocodeResult[];
}

export async function generateKundli(
  req: KundliRequest,
): Promise<KundliResponse> {
  const res = await fetch("/api/kundli", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as KundliResponse;
}

/** Persist the last result so /result and /report can read it without recomputing. */
export function saveResult(result: KundliResponse): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    /* sessionStorage may be unavailable; ignore */
  }
}

export function loadResult(): KundliResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as KundliResponse) : null;
  } catch {
    return null;
  }
}
