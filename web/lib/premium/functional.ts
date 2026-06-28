import type { KundliResponse } from "@/lib/types";
import { lordOfRashi } from "@/lib/jyotish-ui";
import { PREMIUM_CONFIG as CFG } from "./config";

// Functional nature of each planet for a given Lagna — the cornerstone of real
// Vedic judgement. A planet is good or bad for THIS chart based on the houses it
// rules, not its natural character.

export type Nature = "benefic" | "malefic" | "maraka" | "neutral";

export interface FunctionalInfo {
  nature: Nature;
  isYogakaraka: boolean;
  housesOwned: number[]; // 1..12 from the Lagna
}

const CLASSICAL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const TRIKONA = [1, 5, 9];
const KENDRA = [4, 7, 10];     // angles other than the 1st
const DUSTHANA = [6, 8, 12];
const MARAKA = [2, 7];

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

export function getFunctional(data: KundliResponse): Record<string, FunctionalInfo> {
  const k = data.kundli;
  const ascSign0 = k.ascendant.rashi - 1;
  const signOfHouse = (h: number) => (ascSign0 + (h - 1)) % 12;

  // Houses each classical planet owns (from the Lagna).
  const owned: Record<string, number[]> = {};
  for (const p of CLASSICAL) owned[p] = [];
  for (let h = 1; h <= 12; h++) owned[lordOfRashi(signOfHouse(h) + 1)]?.push(h);

  const out: Record<string, FunctionalInfo> = {};

  for (const p of CLASSICAL) {
    const houses = owned[p];
    const hasTrikona = houses.some((h) => TRIKONA.includes(h));
    const hasKendra = houses.some((h) => KENDRA.includes(h));
    const hasDusthana = houses.some((h) => DUSTHANA.includes(h));
    const isLagnaLord = houses.includes(1);
    const onlyMaraka = houses.length > 0 && houses.every((h) => MARAKA.includes(h));

    const isYogakaraka = hasKendra && hasTrikona;
    let nature: Nature;
    if (isYogakaraka || isLagnaLord || hasTrikona) nature = "benefic";
    else if (hasDusthana) nature = "malefic";
    else if (onlyMaraka) nature = "maraka";
    else nature = "neutral";

    out[p] = { nature, isYogakaraka, housesOwned: houses };
  }

  // Nodes act like the lord of the sign they occupy (their dispositor).
  for (const p of ["Rahu", "Ketu"]) {
    const pos = k.planets[p];
    if (!pos) continue;
    const dispositor = lordOfRashi(signOf(pos.longitude) + 1);
    const disp = out[dispositor];
    out[p] = { nature: disp?.nature ?? "neutral", isYogakaraka: false, housesOwned: [] };
  }

  return out;
}

/** A −1…+1 factor for how "good" a planet is functionally (used to weight dasha/aspects). */
export function functionalFactor(info: FunctionalInfo | undefined): number {
  if (!info) return 0;
  const f = CFG.functionalFactor;
  if (info.isYogakaraka) return f.yogakaraka;
  if (info.nature === "benefic") return f.benefic;
  if (info.nature === "neutral") return f.neutral;
  if (info.nature === "maraka") return f.maraka;
  return f.malefic;
}
