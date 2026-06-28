import type { KundliResponse } from "@/lib/types";
import { lordOfRashi, RASHI_NAMES } from "@/lib/jyotish-ui";
import { getShadbala } from "@/lib/shadbala";
import { getDignities, ALL_PLANETS, type DignityInfo } from "./dignity";
import { getFunctional, functionalFactor, type FunctionalInfo } from "./functional";
import { getAspects, type AspectResult } from "./aspects";
import { getDasavargaCounts } from "./varga";
import { detectYogas, type DetectedYoga, type YogaContext } from "./yogas";
import { PREMIUM_CONFIG as CFG } from "./config";

export type { DetectedYoga };

// The classical strength engine. Planet strength blends graded dignity, Shadbala,
// Ashtakavarga, functional drishti and avastha (combustion/retrogression);
// house strength blends its lord, the house karaka, SAV, functional occupants and
// aspects. No borrowed "compatibility table" — this is our own logic.

const CLASSICAL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// Natural significator (karaka) of each house.
const HOUSE_KARAKA: Record<number, string> = {
  1: "Sun", 2: "Jupiter", 3: "Mars", 4: "Moon", 5: "Jupiter", 6: "Saturn",
  7: "Venus", 8: "Saturn", 9: "Jupiter", 10: "Sun", 11: "Jupiter", 12: "Saturn",
};

const signOf = (l: number) => Math.floor((((l % 360) + 360) % 360) / 30);
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export interface Factors {
  ascSign0: number;
  signOfHouse: (h: number) => number;
  planetHouse: Record<string, number>;
  planetSign0: Record<string, number>;
  dignity: Record<string, DignityInfo>;
  functional: Record<string, FunctionalInfo>;
  planetStrength: Record<string, number>;  // 0–100
  houseStrength: number[];                  // index 1..12, 0–100
  aspects: AspectResult;
  occupants: Record<number, string[]>;
  yogakaraka: string | null;
  bhagyaLord: string;
  atmakaraka: string;
  housesOwned: Record<string, number[]>;
  vargaDignityCount: Record<string, number>; // 0–10 dignified Dasavarga charts per planet
  baladiAvastha: Record<string, string>;     // Baladi (age) state per classical planet
  yogas: DetectedYoga[];
}

export function getFactors(data: KundliResponse): Factors {
  const k = data.kundli;
  const ascSign0 = k.ascendant.rashi - 1;
  const signOfHouse = (h: number) => (ascSign0 + (h - 1)) % 12;

  const dignity = getDignities(data);
  const functional = getFunctional(data);

  const planetSign0: Record<string, number> = {};
  const planetHouse: Record<string, number> = {};
  for (const p of ALL_PLANETS) {
    const pos = k.planets[p];
    if (!pos) continue;
    planetSign0[p] = signOf(pos.longitude);
    planetHouse[p] = ((planetSign0[p] - ascSign0 + 12) % 12) + 1;
  }

  const occupants: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) occupants[h] = [];
  for (const p of ALL_PLANETS) if (planetHouse[p]) occupants[planetHouse[p]].push(p);

  const aspects = getAspects(planetHouse, occupants, functional);

  const shad: Record<string, { rupas: number; required: number }> = {};
  for (const row of getShadbala(data)) shad[row.planet] = { rupas: row.rupas, required: row.required };
  const bav = k.ashtakavarga?.bav ?? {};

  // ── Planet strength (0–100) ──
  const vargaCount = getDasavargaCounts(data); // 0–10 dignified vargas per classical planet
  // Baladi avastha (age state) effectiveness 0..1 by degree-in-sign: a planet at the
  // sign's middle ("youth") is fully effective; the edges ("child"/"old"/"dead") less so.
  const BALADI = [0.25, 0.5, 1.0, 0.25, 0.0];                 // child, adolescent, youth, old, dead
  const BALADI_NAME = ["Child", "Adolescent", "Youth", "Old", "Dead"];
  const baladiBand = (s0: number, lonDeg: number) => {        // 0..4 age-state index
    const b = Math.min(4, Math.floor(lonDeg / 6));
    return s0 % 2 === 0 ? b : 4 - b;                          // even rasis reverse the order
  };
  const baladiAvastha: Record<string, string> = {};
  const planetStrength: Record<string, number> = {};
  for (const p of ALL_PLANETS) {
    if (planetSign0[p] === undefined) continue;
    const D = dignity[p]?.score ?? 50;
    const A = clamp(((bav[p]?.[planetSign0[p]] ?? 4) / 8) * 100);
    const F = clamp(50 + (aspects.planetNet[p] ?? 0) * 4);
    const vb = Math.min(CFG.dasavarga.planetCap, (vargaCount[p] ?? 0) * CFG.dasavarga.planetPerVarga);
    if (CLASSICAL.includes(p)) {
      const S = shad[p] ? clamp((shad[p].rupas - shad[p].required) * 12 + 50) : 50;
      let V = CFG.avastha.base;
      if (dignity[p]?.combust) V -= CFG.avastha.combustPenalty;
      if (dignity[p]?.retro && p !== "Sun" && p !== "Moon") V += CFG.avastha.retroBonus;
      const w = CFG.planetWeights;
      const bIdx = baladiBand(planetSign0[p], (((k.planets[p].longitude % 360) + 360) % 360) % 30);
      baladiAvastha[p] = BALADI_NAME[bIdx];
      const baladiAdj = -(1 - BALADI[bIdx]) * CFG.baladi.penalty;
      planetStrength[p] = clamp(w.dignity * D + w.shadbala * S + w.ashtakavarga * A + w.drishti * F + w.avastha * clamp(V) + vb + baladiAdj, 5, 99);
    } else {
      const w = CFG.nodeWeights;
      planetStrength[p] = clamp(w.dignity * D + w.ashtakavarga * A + w.drishti * F + vb, 5, 99);
    }
  }

  // ── House strength (0–100) ──
  // Argala (intervention): planets in the 2nd, 4th & 11th from a house intervene in
  // its affairs; the 12th, 10th & 3rd respectively obstruct (virodhargala). A benefic
  // intervention helps the house, a malefic one challenges it — unless obstructed.
  const nthHouse = (h: number, n: number) => ((h - 1 + (n - 1)) % 12) + 1;
  const ARGALA: [number, number][] = [[2, 12], [4, 10], [11, 3]];
  const sav = k.ashtakavarga?.sav ?? new Array(12).fill(28);
  const houseStrength: number[] = [0];
  for (let h = 1; h <= 12; h++) {
    const s = signOfHouse(h);
    const savScore = clamp(((sav[s] - 17) / (40 - 17)) * 100);
    const lord = lordOfRashi(s + 1);
    const lordStr = planetStrength[lord] ?? 45;
    const karakaStr = planetStrength[HOUSE_KARAKA[h]] ?? 45;
    const ha = CFG.houseAdjust, hw = CFG.houseWeights;
    let occ = 0;
    for (const p of occupants[h]) occ += functionalFactor(functional[p]) * ha.occupantPerPlanet;
    occ = Math.max(-ha.occupantCap, Math.min(ha.occupantCap, occ));
    const aspAdj = Math.max(-ha.aspectCap, Math.min(ha.aspectCap, aspects.houseNet[h] * ha.aspectMult));
    const lh = planetHouse[lord];
    const lordPlaced = [1, 4, 5, 7, 9, 10].includes(lh) ? ha.lordInGoodHouse : [6, 8, 12].includes(lh) ? ha.lordInDusthana : 0;
    let arg = 0;
    for (const [a, o] of ARGALA) {
      const aPl = occupants[nthHouse(h, a)], oPl = occupants[nthHouse(h, o)];
      if (aPl.length === 0 || aPl.length < oPl.length) continue; // no argala, or fully obstructed
      for (const p of aPl) arg += functionalFactor(functional[p]);
      for (const p of oPl) arg -= functionalFactor(functional[p]) * 0.5; // obstructor partly offsets
    }
    arg = Math.max(-ha.argalaCap, Math.min(ha.argalaCap, arg * ha.argalaMult));
    houseStrength[h] = clamp(hw.lord * lordStr + hw.sav * savScore + hw.karaka * karakaStr + hw.neutralBase + occ + aspAdj + lordPlaced + arg);
  }

  // Houses owned (classical) for yoga detection.
  const housesOwned: Record<string, number[]> = {};
  for (const p of CLASSICAL) housesOwned[p] = functional[p]?.housesOwned ?? [];

  const yogakaraka = CLASSICAL.find((p) => functional[p]?.isYogakaraka) ?? null;
  const bhagyaLord = lordOfRashi(signOfHouse(9) + 1);
  const atmakaraka = k.jaimini?.atmakaraka ?? "Sun";

  // Moon waxing (Shukla paksha) → benefic Moon, used by the yoga engine.
  const moonLon = k.planets["Moon"]?.longitude ?? 0;
  const sunLon = k.planets["Sun"]?.longitude ?? 0;
  const moonWaxing = ((moonLon - sunLon + 360) % 360) < 180;
  const lon: Record<string, number> = {};
  for (const p of ALL_PLANETS) {
    const pos = k.planets[p];
    if (pos) lon[p] = (((pos.longitude % 360) + 360) % 360);
  }
  const amatyakaraka = k.jaimini?.karakas?.find((c) => /Amatya/.test(c.karaka))?.planet ?? atmakaraka;
  const arudhaSign0 = RASHI_NAMES.indexOf(k.jaimini?.arudhaLagna ?? "");
  const yogaCtx: YogaContext = {
    house: planetHouse, sign0: planetSign0, dignity, owned: housesOwned, moonWaxing, ascSign0,
    vargaDignityCount: vargaCount, lon, amatyakaraka, atmakaraka, arudhaSign0,
  };
  const yogas = detectYogas(yogaCtx);

  return {
    ascSign0, signOfHouse, planetHouse, planetSign0, dignity, functional,
    planetStrength, houseStrength, aspects, occupants, yogakaraka,
    bhagyaLord, atmakaraka, housesOwned, vargaDignityCount: vargaCount, baladiAvastha, yogas,
  };
}
