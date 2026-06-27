import type { KundliResponse } from "@/lib/types";
import { planetDignityBySign } from "@/lib/jyotish-ui";

// Shadbala — the six-fold strength of a planet. The well-defined components are
// computed here; a few intricate Kala sub-balas (Ayana, Tribhaga, time-lords)
// and Drik bala are simplified, so totals are best read as indicative.

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// Deep-exaltation longitudes (degrees, 0 = 0° Aries).
const EXALT_LON: Record<string, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};

const NAISARGIKA: Record<string, number> = {
  Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57,
};

// Minimum required total strength, in Rupas.
const MIN_RUPAS: Record<string, number> = {
  Sun: 5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5,
};

// House giving maximum directional strength.
const DIG_STRONG_HOUSE: Record<string, number> = {
  Jupiter: 1, Mercury: 1, Sun: 10, Mars: 10, Moon: 4, Venus: 4, Saturn: 7,
};

const SAPTAVARGA = ["d1", "d2", "d3", "d7", "d9", "d12", "d30"];
const DIGNITY_VIRUPA: Record<string, number> = {
  Exalted: 30, Own: 30, Friend: 15, Neutral: 7.5, Enemy: 3.75, Debilitated: 1.875, "": 7.5,
};

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);

export interface ShadbalaRow {
  planet: string;
  sthana: number;
  dig: number;
  kala: number;
  cheshta: number;
  naisargika: number;
  totalVirupa: number;
  rupas: number;
  required: number;
  strong: boolean;
}

export function getShadbala(data: KundliResponse): ShadbalaRow[] {
  const k = data.kundli;
  const ascSign = k.ascendant.rashi - 1;
  const sunLon = norm(k.planets["Sun"].longitude);
  const moonLon = norm(k.planets["Moon"].longitude);

  // Day birth if the Sun is above the horizon (houses 7–12 from the Lagna).
  const sunHouse = ((signOf(sunLon) - ascSign + 12) % 12) + 1;
  const dayBirth = sunHouse >= 7;

  // Paksha elongation (Moon from Sun), 0–180°.
  let elong = Math.abs(moonLon - sunLon);
  if (elong > 180) elong = 360 - elong;

  return PLANETS.map((p) => {
    const lon = norm(k.planets[p].longitude);
    const sign = signOf(lon);
    const house = ((sign - ascSign + 12) % 12) + 1;
    const retro = !!k.planets[p].isRetrograde;

    // ── Sthana bala ──
    // Uchcha (exaltation) bala.
    let arc = Math.abs(lon - (EXALT_LON[p] + 180) % 360);
    if (arc > 180) arc = 360 - arc;
    const uchcha = arc / 3; // 0–60

    // Saptavargaja — dignity across seven divisional charts.
    let sapta = 0;
    for (const key of SAPTAVARGA) {
      const v = k.vargas?.[key];
      const r1 = key === "d1" ? sign + 1 : v?.planets[p]?.rashi;
      if (!r1) continue;
      sapta += DIGNITY_VIRUPA[planetDignityBySign(p, r1 - 1)] ?? 7.5;
    }

    // Ojha-Yugma — odd/even sign placement in Rasi and Navamsa.
    const oddPlanet = ["Sun", "Mars", "Jupiter", "Mercury", "Saturn"].includes(p);
    const d9sign = (k.vargas?.d9?.planets[p]?.rashi ?? sign + 1) - 1;
    let ojha = 0;
    for (const s of [sign, d9sign]) {
      const isOdd = s % 2 === 0; // Aries(0) is odd
      if (isOdd === oddPlanet) ojha += 15;
    }

    // Kendradi — angular / succedent / cadent.
    const kendra = [1, 4, 7, 10].includes(house) ? 60 : [2, 5, 8, 11].includes(house) ? 30 : 15;

    // Drekkana — male/female/neutral planets in 1st/3rd/2nd drekkana.
    const drek = Math.floor((lon % 30) / 10); // 0,1,2
    const male = ["Sun", "Mars", "Jupiter"].includes(p);
    const female = ["Moon", "Venus"].includes(p);
    const drekBala = (male && drek === 0) || (female && drek === 2) || (!male && !female && drek === 1) ? 15 : 0;

    const sthana = uchcha + sapta + ojha + kendra + drekBala;

    // ── Dig bala ──
    const strongHouse = DIG_STRONG_HOUSE[p];
    let hd = Math.abs(house - strongHouse);
    if (hd > 6) hd = 12 - hd;
    const dig = 60 * (1 - hd / 6);

    // ── Kala bala (Nathonnatha + Paksha, simplified) ──
    const diurnal = ["Sun", "Jupiter", "Venus"].includes(p);
    const nocturnal = ["Moon", "Mars", "Saturn"].includes(p);
    let natho = 30;
    if (p === "Mercury") natho = 60;
    else if ((diurnal && dayBirth) || (nocturnal && !dayBirth)) natho = 45;
    else natho = 15;

    const benefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(p);
    let paksha = benefic ? elong / 3 : (180 - elong) / 3; // 0–60
    if (p === "Moon") paksha = Math.min(60, paksha * 2);

    const kala = natho + paksha;

    // ── Cheshta bala (approx: retrograde planets are strong) ──
    const cheshta = retro ? 45 : 30;

    const naisargika = NAISARGIKA[p];

    const totalVirupa = sthana + dig + kala + cheshta + naisargika;
    const rupas = totalVirupa / 60;

    return {
      planet: p,
      sthana: +sthana.toFixed(1),
      dig: +dig.toFixed(1),
      kala: +kala.toFixed(1),
      cheshta,
      naisargika: +naisargika.toFixed(1),
      totalVirupa: +totalVirupa.toFixed(1),
      rupas: +rupas.toFixed(2),
      required: MIN_RUPAS[p],
      strong: rupas >= MIN_RUPAS[p],
    };
  });
}
