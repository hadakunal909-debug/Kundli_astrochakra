import type { KundliResponse } from "@/lib/types";
import { lordOfRashi } from "@/lib/jyotish-ui";
import { getFactors, type Factors } from "./factors";
import { functionalFactor } from "./functional";
import { vargaSupport } from "./varga";
import { PREMIUM_CONFIG as CFG } from "./config";

// Life-area scores the way a pro reads a chart: a significator baseline, then the
// DECISIVE yogas / doshas / afflictions swing it sharply, with a reason attached.
// Averaging alone makes everything look generic; named combinations make it real.

export type Band = "Strong" | "Good" | "Moderate" | "Developing";

export interface PremiumScore {
  key: string;
  label: string;
  value: number;
  band: Band;
  note: string; // the dominant reason(s) for this score
}

export interface BestDecade {
  planet: string;
  fromAge: number;
  toAge: number;
  fromYear: number;
  toYear: number;
}

export interface PremiumScores {
  scores: PremiumScore[];
  byKey: Record<string, number>;
  chartStrength: number;
  bestDecade: BestDecade | null;
  factors: Factors;
}

const clamp = (n: number, lo = 5, hi = 99) => Math.max(lo, Math.min(hi, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 50);
const MS_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const band = (v: number): Band =>
  v >= CFG.bands.strong ? "Strong" : v >= CFG.bands.good ? "Good" : v >= CFG.bands.moderate ? "Moderate" : "Developing";

const NAT_MALEFIC = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
const NAT_BENEFIC = ["Jupiter", "Venus", "Mercury", "Moon"];
const DIGNIFIED = ["Exalted", "Own", "Moolatrikona"];

type Check = [boolean, number, string];

export function getPremiumScores(data: KundliResponse): PremiumScores {
  const f = getFactors(data);
  const H = f.houseStrength;
  const P = (p: string) => f.planetStrength[p] ?? 45;
  const lord = (h: number) => lordOfRashi(f.signOfHouse(h) + 1);
  const Plord = (h: number) => P(lord(h));
  const dosh = data.kundli.doshas;

  const hasYoga = (n: string) => f.yogas.some((y) => y.name.includes(n));
  const hasAffliction = (n: string) => f.yogas.some((y) => y.name.includes(n) && y.tone === "bad");
  const auspiciousCount = f.yogas.filter((y) => y.tone === "good").length;
  // Scale a yoga's score swing by how strongly it actually fructifies (graded 0–100
  // from dignity/avastha/placement). A neutral 70 leaves the swing unchanged.
  const powerFactor = (cat: string, neutral = 70, cap = 1.4) => {
    const xs = f.yogas.filter((y) => y.category === cat && typeof y.strength === "number").map((y) => y.strength as number);
    return xs.length ? Math.min(cap, Math.max(0.5, Math.max(...xs) / neutral)) : 1;
  };
  const rajaF = powerFactor("Raja");
  const dhanaF = powerFactor("Dhana");
  const LA = CFG.lifeAreas;

  const karakas = data.kundli.jaimini?.karakas ?? [];
  const amatyakaraka = karakas.find((c) => /Amatya/.test(c.karaka))?.planet ?? f.atmakaraka;

  // ── helpers for combination detection ──
  const st = (p: string) => f.dignity[p]?.state ?? "";
  const strong = (p: string) => P(p) >= 65;
  const weak = (p: string) => P(p) < 40;
  const well = (p: string) => [1, 4, 5, 7, 9, 10].includes(f.planetHouse[p]);
  const dust = (p: string) => [6, 8, 12].includes(f.planetHouse[p]);
  const inH = (p: string, h: number) => f.planetHouse[p] === h;
  const dignifiedIn = (h: number) => (f.occupants[h] ?? []).some((p) => DIGNIFIED.includes(st(p)));
  const hits = (h: number, set: string[]) =>
    (f.occupants[h] ?? []).filter((p) => set.includes(p)).length +
    f.aspects.records.filter((r) => r.toHouse === h && set.includes(r.from)).length;
  const maleficHits = (h: number) => hits(h, NAT_MALEFIC);
  const beneficHits = (h: number) => hits(h, NAT_BENEFIC);

  // baseline (significator blend) + decisive modifiers → final score with reason.
  const mk = (baseline: number, checks: Check[], fallback: string) => {
    const fired = checks.filter((c) => c[0]).map((c) => ({ pts: c[1], txt: c[2] }));
    let total = fired.reduce((a, x) => a + x.pts, 0);
    total = Math.max(-CFG.contrast.modifierCap, Math.min(CFG.contrast.modifierCap, total));
    fired.sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
    const reasons = fired.slice(0, 2).map((x) => x.txt);
    const value = clamp(50 + (baseline - 50) * CFG.contrast.stretch + total);
    return { value, note: reasons.length ? reasons.join(" · ") : fallback };
  };

  // ── Career ──
  const baseCareer = LA.career.h10 * H[10] + LA.career.lord10 * Plord(10) +
    LA.career.karakas * avg([P("Sun"), P("Mercury"), P("Saturn")]) +
    LA.career.d10 * vargaSupport(data, "d10", [lord(10), "Sun", "Saturn", "Mercury"]) +
    LA.career.amatyakaraka * P(amatyakaraka);
  const career = mk(baseCareer, [
    [hasYoga("Raja"), Math.round(14 * rajaF), "Raja yoga lifts status"],
    [strong(lord(10)) && well(lord(10)), 12, "10th lord strong & well-placed"],
    [dignifiedIn(10), 10, "a dignified planet sits in the 10th"],
    [strong("Sun") && well("Sun"), 5, "strong Sun (career karaka)"],
    [dust(lord(10)), -14, "10th lord falls in a dusthana"],
    [st(lord(10)) === "Debilitated", -10, "10th lord is debilitated"],
    [maleficHits(10) >= 2 && beneficHits(10) === 0, -8, "malefics afflict the 10th"],
  ], "10th house, its lord, the D10 and Amatyakaraka.");

  // ── Wealth ──
  const baseWealth = LA.wealth.h2 * H[2] + LA.wealth.h11 * H[11] + LA.wealth.lords * avg([Plord(2), Plord(11)]) +
    LA.wealth.jupiter * P("Jupiter") + LA.wealth.d2 * vargaSupport(data, "d2", [lord(2), "Jupiter", "Venus"]) +
    LA.wealth.d4 * vargaSupport(data, "d4", [lord(4), "Mars", "Venus"]);
  const wealth = mk(baseWealth, [
    [hasYoga("Dhana") || hasYoga("Lakshmi"), Math.round(14 * dhanaF), "a wealth yoga (Dhana/Lakshmi) forms money"],
    [strong(lord(11)) && [1, 2, 5, 9, 11].includes(f.planetHouse[lord(11)]), 10, "11th lord strong & well-placed"],
    [strong("Jupiter") && [1, 2, 4, 5, 7, 9, 10, 11].includes(f.planetHouse["Jupiter"]), 8, "Jupiter (dhana karaka) strong"],
    [dignifiedIn(2) || dignifiedIn(11), 8, "a dignified planet in the 2nd/11th"],
    [weak(lord(11)), -10, "11th lord is weak"],
    [dust(lord(11)), -10, "11th lord placed in a dusthana"],
    [dust(lord(2)), -8, "2nd lord placed in a dusthana"],
    [hasAffliction("Daridra"), -10, "Daridra yoga restricts gains"],
  ], "2nd & 11th houses, Jupiter and the D2.");

  // ── Relationships ──
  const baseRel = LA.relationships.h7 * H[7] + LA.relationships.lord7 * Plord(7) +
    LA.relationships.venus * P("Venus") + LA.relationships.d9 * vargaSupport(data, "d9", ["Venus", lord(7)]);
  const relationships = mk(baseRel, [
    [strong("Venus") && well("Venus"), 8, "Venus strong & well-placed"],
    [beneficHits(7) >= 1 && maleficHits(7) === 0, 8, "benefic influence on the 7th"],
    [vargaSupport(data, "d9", ["Venus", lord(7)]) >= 68, 6, "supportive Navamsa (D9)"],
    [!!dosh?.mangal?.present, dosh?.mangal?.fromLagna && dosh?.mangal?.fromMoon ? -16 : -12, "Manglik (Mangal) dosha"],
    [["Mars", "Saturn", "Rahu", "Ketu"].some((p) => inH(p, 7)), -10, "a malefic sits in the 7th"],
    [dust(lord(7)), -12, "7th lord falls in a dusthana"],
    [st("Venus") === "Debilitated" || !!f.dignity["Venus"]?.combust, -8, "Venus is afflicted"],
  ], "7th house & lord, Venus and the D9.");

  // ── Leadership ──
  const baseLead = LA.leadership.h1 * H[1] + LA.leadership.h10 * H[10] + LA.leadership.sun * P("Sun") + LA.leadership.lord1 * Plord(1);
  const leadership = mk(baseLead, [
    [hasYoga("Raja"), Math.round(14 * rajaF), "Raja yoga"],
    [strong("Sun") && [1, 9, 10, 11].includes(f.planetHouse["Sun"]), 10, "Sun strong & well-placed"],
    [!!f.yogakaraka && strong(f.yogakaraka), 8, "a strong Yogakaraka"],
    [st("Sun") === "Debilitated" || !!f.dignity["Sun"]?.combust, -10, "the Sun is afflicted"],
  ], "Lagna & 10th with the Sun.");

  // ── Entrepreneurship ──
  const baseEnt = LA.entrepreneurship.h3 * H[3] + LA.entrepreneurship.h10 * H[10] + LA.entrepreneurship.h11 * H[11] +
    LA.entrepreneurship.h7 * H[7] + LA.entrepreneurship.marsRahu * avg([P("Mars"), P("Rahu")]) + LA.entrepreneurship.h1 * H[1] +
    LA.entrepreneurship.d3 * vargaSupport(data, "d3", ["Mars", lord(3)]);
  const entrepreneurship = mk(baseEnt, [
    [strong("Mars") && well("Mars"), 8, "strong Mars (drive)"],
    [[3, 6, 10, 11].includes(f.planetHouse["Rahu"]), 6, "Rahu in an upachaya house"],
    [strong(lord(11)), 6, "strong 11th lord (gains)"],
    [strong(lord(1)), 6, "strong Lagna lord"],
    [H[1] < 40, -8, "a weak Lagna"],
  ], "3rd, 10th & 11th with Mars and Rahu.");

  // ── Foreign settlement ──
  const baseForeign = LA.foreign.h12 * H[12] + LA.foreign.h9 * H[9] + LA.foreign.h3 * H[3] + LA.foreign.rahu * P("Rahu") + LA.foreign.lord12 * Plord(12);
  const foreign = mk(baseForeign, [
    [[12, 9, 3, 7].includes(f.planetHouse["Rahu"]), 10, "Rahu favours foreign lands"],
    [strong(lord(12)) || [3, 9, 12].includes(f.planetHouse[lord(12)]), 6, "12th lord supports going abroad"],
    [H[12] >= 60 && H[9] >= 55, 6, "strong 12th & 9th houses"],
    [H[12] < 40, -6, "a weak 12th house"],
  ], "12th, 9th & 3rd houses and Rahu.");

  // ── Hidden talents ──
  const baseHidden = LA.hiddenTalents.h5 * H[5] + LA.hiddenTalents.h3 * H[3] + LA.hiddenTalents.mercury * P("Mercury") +
    LA.hiddenTalents.ketu * P("Ketu") + LA.hiddenTalents.d24 * vargaSupport(data, "d24", ["Mercury", lord(5)]);
  const hiddenTalents = mk(baseHidden, [
    [dignifiedIn(5), 10, "a dignified planet in the 5th"],
    [strong("Mercury") && [1, 3, 5, 9, 10].includes(f.planetHouse["Mercury"]), 6, "sharp, well-placed Mercury"],
    [strong(lord(5)), 6, "a strong 5th lord"],
    [maleficHits(5) >= 2 && beneficHits(5) === 0, -6, "the 5th is afflicted"],
  ], "5th & 3rd houses, Mercury/Ketu and the D24.");

  // ── Health ──
  const baseHealth = LA.health.h1 * H[1] + LA.health.lord1 * Plord(1) + LA.health.moon * P("Moon") + LA.health.sun * P("Sun") +
    LA.health.d30 * vargaSupport(data, "d30", [lord(1), "Moon", "Sun"]);
  const health = mk(baseHealth, [
    [H[1] >= 65 && strong(lord(1)), 10, "strong Lagna & its lord"],
    [dust(lord(1)), -12, "Lagna lord falls in a dusthana"],
    [maleficHits(1) >= 1 && beneficHits(1) === 0, -8, "malefic affliction to the Lagna"],
    [!!dosh?.sadeSati?.active, -6, "Sade Sati is running"],
    [maleficHits(8) >= 2, -5, "an afflicted 8th (longevity) house"],
    [hasAffliction("Vish") || hasAffliction("Kemadruma"), -6, "an affliction to the Moon (Vish/Kemadruma)"],
  ], "Lagna & its lord with the Moon and Sun.");

  // ── Life purpose ──
  const baseLife = LA.lifePurpose.h1 * H[1] + LA.lifePurpose.h9 * H[9] + LA.lifePurpose.h10 * H[10] + LA.lifePurpose.h5 * H[5] +
    LA.lifePurpose.atmakaraka * P(f.atmakaraka) + LA.lifePurpose.d20 * vargaSupport(data, "d20", [f.atmakaraka, "Jupiter", lord(9)]);
  const lifePurpose = mk(baseLife, [
    [hasYoga("Raja"), Math.round(10 * rajaF), "Raja yoga"],
    [strong(f.atmakaraka) && [1, 5, 9, 10].includes(f.planetHouse[f.atmakaraka]), 10, "soul planet (Atmakaraka) strong & well-placed"],
    [auspiciousCount >= 3, 8, "several supportive yogas"],
    [H[9] >= 60, 5, "a strong house of fortune (9th)"],
    [!!dosh?.kalsarpa?.present, -6, "Kala Sarpa yoga (effort before rise)"],
    [hasAffliction("Kemadruma"), -6, "Kemadruma asks for inner steadiness"],
  ], "Lagna, 9th & 10th and the soul planet.");

  const mkScore = (key: string, label: string, r: { value: number; note: string }): PremiumScore =>
    ({ key, label, value: r.value, band: band(r.value), note: r.note });

  const scores: PremiumScore[] = [
    mkScore("lifePurpose", "Life Purpose", lifePurpose),
    mkScore("career", "Career", career),
    mkScore("wealth", "Wealth", wealth),
    mkScore("relationships", "Relationships", relationships),
    mkScore("leadership", "Leadership", leadership),
    mkScore("entrepreneurship", "Entrepreneurship", entrepreneurship),
    mkScore("foreign", "Foreign Settlement", foreign),
    mkScore("hiddenTalents", "Hidden Talents", hiddenTalents),
    mkScore("health", "Health & Vitality", health),
  ];

  const byKey: Record<string, number> = {};
  for (const s of scores) byKey[s.key] = s.value;

  const chartStrength = clamp(avg(scores.map((x) => x.value)));

  return { scores, byKey, chartStrength, bestDecade: bestDecade(data, f), factors: f };
}

// Most Empowered Period — the Mahadasha whose lord is strongest AND functionally
// good for this chart (benefics, the Yogakaraka and well-placed lords win; a
// poorly-placed node will not).
function bestDecade(data: KundliResponse, f: Factors): BestDecade | null {
  const mds = data.kundli.dasha?.mahadashas;
  if (!mds || !mds.length) return null;
  const birth = new Date(data.input.utcInstant).getTime();

  let best: BestDecade | null = null;
  let bestScore = -1e9;
  for (const m of mds) {
    const start = new Date(m.startTime).getTime();
    const end = new Date(m.endTime).getTime();
    const fromAge = (start - birth) / MS_YEAR;
    const toAge = (end - birth) / MS_YEAR;
    if (toAge < 0 || fromAge > 90) continue;

    const strength = f.planetStrength[m.planet] ?? 45;
    const ff = functionalFactor(f.functional[m.planet]);
    const inGoodHouse = [1, 4, 5, 7, 9, 10].includes(f.planetHouse[m.planet]);
    const inDusthana = [6, 8, 12].includes(f.planetHouse[m.planet]);
    const inYoga = f.yogas.some((y) => y.tone === "good" && y.detail.includes(m.planet)) || f.yogakaraka === m.planet;

    const D = CFG.dasha;
    const score =
      strength * (1 + D.functionalMult * ff) +
      (inYoga ? D.yogaBonus : 0) +
      (inGoodHouse ? D.goodHouseBonus : inDusthana ? D.dusthanaPenalty : 0) +
      Math.min(toAge - fromAge, D.durationCap) * D.durationWeight;

    if (score > bestScore) {
      bestScore = score;
      best = {
        planet: m.planet,
        fromAge: Math.max(0, Math.round(fromAge)),
        toAge: Math.round(toAge),
        fromYear: new Date(start).getFullYear(),
        toYear: new Date(end).getFullYear(),
      };
    }
  }
  return best;
}
