import type { KundliResponse } from "@/lib/types";
import { naturalDignityScore } from "./dignity";

// Divisional-chart corroboration. A pro reads each life area in its varga (career
// in D10, marriage in D9, wealth in D2, etc.); here we measure how dignified the
// relevant planets are within a given varga.

/** Average sign-based dignity (0–100) of the given planets within a varga (e.g. "d10"). */
export function vargaSupport(data: KundliResponse, vargaKey: string, planets: string[]): number {
  const v = data.kundli.vargas?.[vargaKey];
  if (!v) return 50; // neutral if the varga is unavailable
  const scores: number[] = [];
  for (const p of planets) {
    const pos = v.planets[p];
    if (!pos) continue;
    scores.push(naturalDignityScore(p, pos.rashi - 1));
  }
  if (!scores.length) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// The ten vargas of Parasara's Dasavarga scheme, used for amsa-strength.
const DASAVARGA = ["d1", "d2", "d3", "d7", "d9", "d10", "d12", "d16", "d30", "d60"];
const DASAVARGA_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** For each classical planet, in how many of the ten Dasavarga charts it sits in an
 *  own / exaltation / moolatrikona sign (0–10) — Parasara's amsa-strength count. */
export function getDasavargaCounts(data: KundliResponse): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of DASAVARGA_PLANETS) {
    let c = 0;
    for (const key of DASAVARGA) {
      const pos = data.kundli.vargas?.[key]?.planets?.[p];
      if (pos && naturalDignityScore(p, pos.rashi - 1) >= 85) c++; // 85 = Own/Moolatrikona/Exalted
    }
    out[p] = c;
  }
  return out;
}

// Classical name for a Dasavarga dignity count. Index = count (0–10).
const AMSA = ["", "", "Parijatamsa", "Uttamamsa", "Gopuramsa", "Simhasanamsa", "Paravatamsa", "Devalokamsa", "Brahmalokamsa", "Airavatamsa", "Sridhamamsa", "Sridhamamsa"];
/** Classical amsa name for a Dasavarga dignity count (0–10); "" for an ordinary count (0–1). */
export function amsaLabel(count: number): string {
  return AMSA[Math.max(0, Math.min(AMSA.length - 1, count))] ?? "";
}

/** The lord of a given house counted from the varga's own ascendant. */
export function vargaHouseLord(data: KundliResponse, vargaKey: string, house: number): string | null {
  const v = data.kundli.vargas?.[vargaKey];
  if (!v) return null;
  const RASHI_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const sign0 = (v.ascendant.rashi - 1 + (house - 1)) % 12;
  return RASHI_LORD[sign0];
}
