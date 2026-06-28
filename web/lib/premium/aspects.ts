import { functionalFactor, type FunctionalInfo } from "./functional";
import { PREMIUM_CONFIG as CFG } from "./config";

// Drishti (aspect) analysis, scored by the aspecting planet's FUNCTIONAL nature
// for this chart — a functional benefic's gaze strengthens, a functional
// malefic's gaze weakens, scaled by the aspect and what it falls on.

const SPECIAL: Record<string, number[]> = {
  Jupiter: [5, 7, 9], Mars: [4, 7, 8], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9],
};
const STANDARD = [7];
const ALL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export interface AspectRecord {
  from: string;
  toHouse: number;
  score: number;     // −5…+5
  targets: string[];
}

export interface AspectResult {
  records: AspectRecord[];
  houseNet: number[];                // index 1..12
  planetNet: Record<string, number>; // net aspect score landing on each planet's house
}

export function getAspects(
  planetHouse: Record<string, number>,
  occupants: Record<number, string[]>,
  functional: Record<string, FunctionalInfo>,
): AspectResult {
  const records: AspectRecord[] = [];
  const houseNet = new Array(13).fill(0);

  for (const p of ALL) {
    const from = planetHouse[p];
    if (!from) continue;
    const ff = functionalFactor(functional[p]); // −1…+1
    const offsets = SPECIAL[p] ?? STANDARD;
    for (const h of offsets) {
      const toHouse = ((from - 1 + (h - 1)) % 12) + 1;
      const targets = occupants[toHouse] ?? [];
      const a = CFG.aspect;
      let score = ff * a.baseMagnitude; // yogakaraka +max … functional malefic negative
      // Nudge by what sits in the aspected house.
      const targetFactor = targets.reduce((acc, t) => acc + functionalFactor(functional[t]), 0);
      if (ff > 0 && targetFactor > 0) score += a.targetNudge;
      if (ff < 0 && targetFactor > 0) score -= a.targetNudge; // malefic gaze on a good planet
      score = Math.max(-a.cap, Math.min(a.cap, Math.round(score)));
      records.push({ from: p, toHouse, score, targets });
      houseNet[toHouse] += score;
    }
  }

  const planetNet: Record<string, number> = {};
  for (const p of ALL) {
    if (!planetHouse[p]) continue;
    planetNet[p] = records
      .filter((r) => r.toHouse === planetHouse[p] && r.from !== p)
      .reduce((a, r) => a + r.score, 0);
  }

  return { records, houseNet, planetNet };
}
