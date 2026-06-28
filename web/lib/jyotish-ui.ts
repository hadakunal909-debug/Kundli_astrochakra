import type { KundliResponse } from "./types";

// ── Planet display ───────────────────────────────────────────────────────────

export const PLANET_ORDER = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

export const PLANET_ABBR: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
  Uranus: "Ur", Neptune: "Ne", Pluto: "Pl",
};

// Distinct, professional palette (approximates classic Vedic-software colouring).
export const PLANET_COLOR: Record<string, string> = {
  Sun: "#C62828", Moon: "#5E35B1", Mars: "#2E7D32", Mercury: "#1565C0",
  Jupiter: "#6A1B9A", Venus: "#00838F", Saturn: "#283593", Rahu: "#6D4C41",
  Ketu: "#8D6E63", Uranus: "#0097A7", Neptune: "#455A64", Pluto: "#212121",
};

// Generated glyph icons (in web/public/planets/). The nine grahas have icons;
// the outer planets fall back to their text abbreviation.
export const PLANET_ICON: Record<string, string> = {
  Sun: "/planets/sun.svg", Moon: "/planets/moon.svg", Mars: "/planets/mars.svg",
  Mercury: "/planets/mercury.svg", Jupiter: "/planets/jupiter.svg",
  Venus: "/planets/venus.svg", Saturn: "/planets/saturn.svg",
  Rahu: "/planets/rahu.svg", Ketu: "/planets/ketu.svg",
};

export const RASHI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Lord of each rashi (index 0 = Aries … 11 = Pisces).
const RASHI_LORD = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

/** Lord of a rashi given its 1-indexed sign number (1 = Aries … 12 = Pisces). */
export function lordOfRashi(rashi1: number): string {
  return RASHI_LORD[(rashi1 - 1 + 12) % 12];
}

// Naisargika (natural) friendships for the seven classical grahas.
const FRIENDS: Record<string, string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const ENEMIES: Record<string, string[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

/** Relationship of a planet with the lord of the sign it occupies. "" for nodes/outer. */
export function computeRelation(planet: string, longitude: number): string {
  if (!FRIENDS[planet]) return ""; // Rahu/Ketu/Uranus/Neptune/Pluto
  const rashi0 = Math.floor((((longitude % 360) + 360) % 360) / 30);
  const lord = RASHI_LORD[rashi0];
  if (lord === planet) return "Own";
  if (FRIENDS[planet].includes(lord)) return "Friend";
  if (ENEMIES[planet].includes(lord)) return "Enemy";
  return "Neutral";
}

// Exaltation / debilitation signs (0 = Aries … 11 = Pisces) for the seven grahas.
const EXALT_SIGN: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const DEBIL_SIGN: Record<string, number> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};

/** Dignity of a planet given the sign (0=Aries…11=Pisces) it occupies. */
export function planetDignityBySign(planet: string, sign0: number): string {
  const r = ((sign0 % 12) + 12) % 12;
  if (EXALT_SIGN[planet] === r) return "Exalted";
  if (DEBIL_SIGN[planet] === r) return "Debilitated";
  if (!FRIENDS[planet]) return ""; // nodes / outer planets
  const lord = RASHI_LORD[r];
  if (lord === planet) return "Own";
  if (FRIENDS[planet].includes(lord)) return "Friend";
  if (ENEMIES[planet].includes(lord)) return "Enemy";
  return "Neutral";
}

/** Dignity of a planet from its longitude. */
export function planetDignity(planet: string, longitude: number): string {
  return planetDignityBySign(planet, Math.floor((((longitude % 360) + 360) % 360) / 30));
}

// House (Bhava) names, 1 → 12.
export const BHAVA_NAMES = [
  "Tanu · Self",
  "Dhana · Wealth",
  "Sahaja · Siblings",
  "Sukha · Home",
  "Putra · Children",
  "Ari · Health",
  "Yuvati · Spouse",
  "Randhra · Longevity",
  "Dharma · Fortune",
  "Karma · Career",
  "Labha · Gains",
  "Vyaya · Loss",
];

// ── Longitude formatting ─────────────────────────────────────────────────────

/** Whole degrees within the sign, e.g. 87.34 → 27. */
export function degreeInSign(longitude: number): number {
  return Math.floor((((longitude % 30) + 30) % 30));
}

/** Longitude → "DD-MM-SS" within its sign. */
export function formatDMS(longitude: number): string {
  let x = (((longitude % 30) + 30) % 30);
  let d = Math.floor(x);
  let mf = (x - d) * 60;
  let m = Math.floor(mf);
  let s = Math.round((mf - m) * 60);
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d)}-${p(m)}-${p(s)}`;
}

// ── Chart data ───────────────────────────────────────────────────────────────

export interface PlanetGlyph {
  abbr: string;
  color: string;
  icon?: string; // path to a glyph icon (grahas only); falls back to abbr
  degree?: number; // whole degrees within sign (D1 only)
  retro?: boolean;
}

export interface ChartData {
  ascRashi: number; // 1 = Aries … 12 = Pisces
  houses: Record<number, PlanetGlyph[]>; // house 1..12 → planets
}

function emptyHouses(): Record<number, PlanetGlyph[]> {
  const h: Record<number, PlanetGlyph[]> = {};
  for (let i = 1; i <= 12; i++) h[i] = [];
  return h;
}

function glyphFor(name: string, extra?: Partial<PlanetGlyph>): PlanetGlyph {
  return {
    abbr: PLANET_ABBR[name] ?? name.slice(0, 2),
    color: PLANET_COLOR[name] ?? "#212121",
    icon: PLANET_ICON[name],
    ...extra,
  };
}

/** Build the Lagna (D1) chart data with degrees + retrograde. */
export function buildD1(data: KundliResponse): ChartData {
  const k = data.kundli;
  const houses = emptyHouses();
  for (const h of k.houses) {
    if (h.number < 1 || h.number > 12) continue;
    for (const name of h.planets) {
      const p = k.planets[name];
      if (!p) continue;
      houses[h.number].push(
        glyphFor(name, { degree: degreeInSign(p.longitude), retro: p.isRetrograde }),
      );
    }
  }
  return { ascRashi: k.ascendant.rashi, houses };
}

/**
 * Build any divisional chart (D2…D60) from `kundli.vargas[key]` — sign-only
 * placement (no degrees). D1 should use `buildD1` for degrees + retrograde.
 */
export function buildVarga(data: KundliResponse, key: string): ChartData | null {
  if (key === "d1") return buildD1(data);
  const v = data.kundli.vargas?.[key];
  if (!v) return null;
  const ascRashi = v.ascendant.rashi; // 1-indexed
  const houses = emptyHouses();
  for (const [name, pos] of Object.entries(v.planets)) {
    const house = ((pos.rashi - ascRashi + 12) % 12) + 1; // whole-sign house
    houses[house].push(glyphFor(name));
  }
  return { ascRashi, houses };
}

/** Build the Navamsa (D9) chart data — sign placements only, no degrees. */
export function buildD9(data: KundliResponse): ChartData | null {
  return buildVarga(data, "d9");
}

/** Build the Bhava Chalit chart — planets placed by their bhava (asc-centred houses). */
export function buildChalitChart(data: KundliResponse): ChartData | null {
  const c = data.kundli.chalit;
  if (!c) return null;
  const houses = emptyHouses();
  for (const p of c.planets) {
    if (p.bhava < 1 || p.bhava > 12) continue;
    houses[p.bhava].push(glyphFor(p.name, { degree: degreeInSign(p.longitude) }));
  }
  return { ascRashi: c.ascRashi, houses };
}

// Divisional-chart catalogue (Parashari shodasavarga set computed by the library).
export interface VargaMeta {
  key: string;
  label: string;
  purpose: string;
}

// Classical names + significations for the divisions that have them. Divisions not
// listed here are unnamed and use the generic cyclic varga rule.
const VARGA_INFO: Record<number, { name: string; purpose: string }> = {
  1: { name: "Rashi", purpose: "Body, overall life" },
  2: { name: "Hora", purpose: "Wealth & resources" },
  3: { name: "Drekkana", purpose: "Siblings, courage" },
  4: { name: "Chaturthamsha", purpose: "Property, fortune" },
  5: { name: "Panchamsa", purpose: "Fame, power, authority" },
  6: { name: "Shashthamsa", purpose: "Health, ailments" },
  7: { name: "Saptamsha", purpose: "Children, progeny" },
  8: { name: "Ashtamsa", purpose: "Sudden events, longevity" },
  9: { name: "Navamsa", purpose: "Spouse, dharma, strength" },
  10: { name: "Dasamsa", purpose: "Career, status" },
  11: { name: "Rudramsa", purpose: "Gains, death & destruction" },
  12: { name: "Dwadasamsa", purpose: "Parents, ancestry" },
  16: { name: "Shodasamsa", purpose: "Vehicles, comforts" },
  20: { name: "Vimsamsa", purpose: "Spirituality" },
  24: { name: "Chaturvimshamsa", purpose: "Education, learning" },
  27: { name: "Bhamsa", purpose: "Strengths & weaknesses" },
  30: { name: "Trimsamsa", purpose: "Misfortunes, doshas" },
  40: { name: "Khavedamsa", purpose: "Maternal lineage" },
  45: { name: "Akshavedamsa", purpose: "Character, conduct" },
  60: { name: "Shashtiamsa", purpose: "Past-life karma" },
};

/** Build a varga-meta entry for division n. */
function vargaMeta(n: number): VargaMeta {
  const info = VARGA_INFO[n];
  return {
    key: `d${n}`,
    label: info ? `D${n} · ${info.name}` : `D${n}`,
    purpose: info ? info.purpose : "Divisional chart (cyclic)",
  };
}

// The classical Shodasavarga (16) — used by the Shodashvarga table.
const SHODASAVARGA_N = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
export const VARGAS: VargaMeta[] = SHODASAVARGA_N.map(vargaMeta);

// Every divisional chart from D1 to D60 — used by the Divisional Charts explorer.
export const ALL_VARGAS: VargaMeta[] = Array.from({ length: 60 }, (_, i) => vargaMeta(i + 1));

// ── House / planet detail (for the interactive chart explorer) ────────────────

export interface PlanetDetail {
  name: string;
  sub?: string;       // nakshatra (or "Lagna")
  status?: string;    // Direct / Retrograde
  dignity?: string;   // Exalted / Own / Friend / …
  iconName?: string;  // graha name for icon lookup
}

export interface HouseDetail {
  signIndex0: number; // 0 = Aries … 11 = Pisces
  planets: PlanetDetail[];
}

/** Per-house details for the D1 (Lagna) chart, using full natal planet data. */
export function buildD1Houses(data: KundliResponse): HouseDetail[] {
  const k = data.kundli;
  const byHouse: Record<number, string[]> = {};
  for (const h of k.houses) {
    if (h.number >= 1 && h.number <= 12) byHouse[h.number] = h.planets;
  }
  const out: HouseDetail[] = [];
  for (let n = 1; n <= 12; n++) {
    const planets: PlanetDetail[] = [];
    if (n === 1) planets.push({ name: "Ascendant", sub: k.ascendant.nakshatra });
    for (const pn of byHouse[n] ?? []) {
      const p = k.planets[pn];
      planets.push({
        name: pn,
        sub: p?.nakshatra,
        status: p ? (p.isRetrograde ? "Retrograde" : "Direct") : undefined,
        dignity: p ? planetDignity(pn, p.longitude) : undefined,
        iconName: pn,
      });
    }
    out.push({ signIndex0: (k.ascendant.rashi - 1 + (n - 1)) % 12, planets });
  }
  return out;
}

/** Per-house details for any divisional chart (dignity relative to that varga's signs). */
export function buildVargaHouses(data: KundliResponse, key: string): HouseDetail[] | null {
  if (key === "d1") return buildD1Houses(data);
  const v = data.kundli.vargas?.[key];
  if (!v) return null;
  const ascR = v.ascendant.rashi; // 1-indexed
  const byHouse: Record<number, { name: string; sign1: number }[]> = {};
  for (const [name, pos] of Object.entries(v.planets)) {
    const house = ((pos.rashi - ascR + 12) % 12) + 1;
    (byHouse[house] ||= []).push({ name, sign1: pos.rashi });
  }
  const out: HouseDetail[] = [];
  for (let n = 1; n <= 12; n++) {
    const planets: PlanetDetail[] = [];
    if (n === 1) planets.push({ name: "Ascendant", sub: "Lagna" });
    for (const { name, sign1 } of byHouse[n] ?? []) {
      const np = data.kundli.planets[name];
      planets.push({
        name,
        sub: np?.nakshatra,
        status: np ? (np.isRetrograde ? "Retrograde" : "Direct") : undefined,
        dignity: planetDignityBySign(name, sign1 - 1),
        iconName: name,
      });
    }
    out.push({ signIndex0: (ascR - 1 + (n - 1)) % 12, planets });
  }
  return out;
}
