import type { KundliResponse } from "@/lib/types";
import { PREMIUM_CONFIG as CFG } from "./config";

// Graded classical dignity (0–100) for every planet, the way an astrologer reads
// strength: exaltation → moolatrikona → own → compound-friend → … → debilitation,
// with Neecha Bhanga (debilitation cancellation), Vargottama, combustion and
// retrogression accounted for.

export const ALL_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const CLASSICAL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// Sign indices: 0 = Aries … 11 = Pisces.
const RASHI_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const EXALT_SIGN: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const MOOLATRIKONA: Record<string, number> = { Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10 };
const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};
// Degree-based sub-dignity within a planet's special sign (where exaltation/moolatrikona/
// own overlap). Classical degree splits: each band is [exclusive upper degree, state].
const DEGREE_DIGNITY: Record<string, { sign: number; bands: [number, string][] }> = {
  Sun:     { sign: 4,  bands: [[20, "Moolatrikona"], [30, "Own"]] },                 // Leo
  Moon:    { sign: 1,  bands: [[3, "Exalted"], [30, "Moolatrikona"]] },              // Taurus
  Mars:    { sign: 0,  bands: [[12, "Moolatrikona"], [30, "Own"]] },                 // Aries
  Mercury: { sign: 5,  bands: [[15, "Exalted"], [20, "Moolatrikona"], [30, "Own"]] },// Virgo
  Jupiter: { sign: 8,  bands: [[10, "Moolatrikona"], [30, "Own"]] },                 // Sagittarius
  Venus:   { sign: 6,  bands: [[15, "Moolatrikona"], [30, "Own"]] },                 // Libra
  Saturn:  { sign: 10, bands: [[20, "Moolatrikona"], [30, "Own"]] },                 // Aquarius
};
// Nodes' exaltation/debilitation (commonly used).
const RAHU_EXALT = [1, 2]; // Taurus, Gemini
const KETU_EXALT = [7, 8]; // Scorpio, Sagittarius

const NAT_FRIEND: Record<string, string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"], Saturn: ["Mercury", "Venus"],
};
const NAT_ENEMY: Record<string, string[]> = {
  Sun: ["Venus", "Saturn"], Moon: [], Mars: ["Mercury"], Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"], Venus: ["Sun", "Moon"], Saturn: ["Sun", "Moon", "Mars"],
};

const GRADE = CFG.dignityGrades;

const norm = (l: number) => ((l % 360) + 360) % 360;
const signOf = (l: number) => Math.floor(norm(l) / 30);
const KENDRA = [1, 4, 7, 10];

const COMBUST_ORB: Record<string, number> = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };

export interface DignityInfo {
  state: string;       // Exalted / Own / Friend / … / Debilitated
  score: number;       // 0–100
  vargottama: boolean;
  neechaBhanga: boolean;
  combust: boolean;
  retro: boolean;
}

function natRel(a: string, b: string): number {
  if (NAT_FRIEND[a]?.includes(b)) return 1;
  if (NAT_ENEMY[a]?.includes(b)) return -1;
  return 0;
}

/** Pure sign-based dignity score (natural friendship only) — used for varga corroboration. */
export function naturalDignityScore(planet: string, sign0: number): number {
  if (EXALT_SIGN[planet] === sign0) return GRADE.Exalted;
  if (MOOLATRIKONA[planet] === sign0) return GRADE.Moolatrikona;
  if (OWN_SIGNS[planet]?.includes(sign0)) return GRADE.Own;
  if ((EXALT_SIGN[planet] + 6) % 12 === sign0) return GRADE.Debilitated;
  const lord = RASHI_LORD[sign0];
  if (lord === planet) return GRADE.Own;
  const r = natRel(planet, lord);
  return r === 1 ? GRADE.Friend : r === -1 ? GRADE.Enemy : GRADE.Neutral;
}

export function getDignities(data: KundliResponse): Record<string, DignityInfo> {
  const k = data.kundli;
  const ascSign0 = k.ascendant.rashi - 1;
  const sign: Record<string, number> = {};
  const houseFromLagna: Record<string, number> = {};
  for (const p of ALL_PLANETS) {
    const pos = k.planets[p];
    if (!pos) continue;
    sign[p] = signOf(pos.longitude);
    houseFromLagna[p] = ((sign[p] - ascSign0 + 12) % 12) + 1;
  }
  const moonSign0 = sign["Moon"];
  const houseFromMoon = (p: string) => ((sign[p] - moonSign0 + 12) % 12) + 1;
  const d9 = k.vargas?.d9;
  const d9Sign0 = (p: string) => (d9?.planets[p] ? d9.planets[p].rashi - 1 : -1);
  const sunLon = norm(k.planets["Sun"]?.longitude ?? 0);
  const inKendra = (p: string) => KENDRA.includes(houseFromLagna[p]) || KENDRA.includes(houseFromMoon(p));

  const out: Record<string, DignityInfo> = {};

  // Compound (natural + temporal) relationship of a planet with the lord of its sign.
  const compound = (planet: string, s0: number): string => {
    const lord = RASHI_LORD[s0];
    const nat = natRel(planet, lord);
    const houseToLord = ((sign[lord] - s0 + 12) % 12) + 1;
    const temp = [2, 3, 4, 10, 11, 12].includes(houseToLord) ? 1 : -1;
    const v = nat + temp;
    return v >= 2 ? "Great Friend" : v === 1 ? "Friend" : v === 0 ? "Neutral" : v === -1 ? "Enemy" : "Great Enemy";
  };

  for (const p of CLASSICAL) {
    if (sign[p] === undefined) continue;
    const s0 = sign[p];
    const deg = norm(k.planets[p].longitude) % 30;
    const dd = DEGREE_DIGNITY[p];
    let state: string;
    if (dd && dd.sign === s0) state = dd.bands.find(([max]) => deg < max)?.[1] ?? "Own"; // degree-split sign
    else if (EXALT_SIGN[p] === s0) state = "Exalted";
    else if ((EXALT_SIGN[p] + 6) % 12 === s0) state = "Debilitated";
    else if (MOOLATRIKONA[p] === s0) state = "Moolatrikona";
    else if (OWN_SIGNS[p].includes(s0)) state = "Own";
    else state = compound(p, s0);

    let score = GRADE[state] ?? 50;
    const vargottama = d9Sign0(p) === s0;
    if (vargottama) score += CFG.vargottamaBonus;

    // Neecha Bhanga (only for debilitated planets).
    let neechaBhanga = false;
    if (state === "Debilitated") {
      const dispositor = RASHI_LORD[s0];
      const exaltLord = CLASSICAL.find((q) => EXALT_SIGN[q] === s0);
      if (
        inKendra(dispositor) ||
        (exaltLord && inKendra(exaltLord)) ||
        sign[dispositor] === s0 ||
        d9Sign0(p) === EXALT_SIGN[p]
      ) {
        neechaBhanga = true;
        score = CFG.neechaBhangaScore;
      }
    }

    const combust = p !== "Sun" && isCombust(p, norm(k.planets[p].longitude), sunLon);
    const retro = !!k.planets[p]?.isRetrograde;
    out[p] = { state, score: clamp(score), vargottama, neechaBhanga, combust, retro };
  }

  // Nodes — judged by exaltation/debilitation and their dispositor (whose results they give).
  for (const p of ["Rahu", "Ketu"]) {
    if (sign[p] === undefined) continue;
    const s0 = sign[p];
    const exaltSet = p === "Rahu" ? RAHU_EXALT : KETU_EXALT;
    const debilSet = p === "Rahu" ? KETU_EXALT : RAHU_EXALT;
    let state = "Neutral";
    let score: number;
    const nd = CFG.nodeDignity;
    if (exaltSet.includes(s0)) { state = "Exalted"; score = nd.exalt; }
    else if (debilSet.includes(s0)) { state = "Debilitated"; score = nd.debil; }
    else {
      const dispScore = out[RASHI_LORD[s0]]?.score ?? 50;
      score = clamp(nd.dispositorWeight * dispScore + nd.dispositorBase);
      state = score >= 65 ? "Friend" : score >= 45 ? "Neutral" : "Enemy";
    }
    const vargottama = d9Sign0(p) === s0;
    if (vargottama) score = clamp(score + CFG.vargottamaBonus);
    out[p] = { state, score: clamp(score), vargottama, neechaBhanga: false, combust: false, retro: true };
  }

  return out;
}

function isCombust(planet: string, planetLon: number, sunLon: number): boolean {
  const orb = COMBUST_ORB[planet];
  if (!orb) return false;
  let d = Math.abs(planetLon - sunLon);
  if (d > 180) d = 360 - d;
  return d < orb;
}

function clamp(n: number, lo = 5, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
