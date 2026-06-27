import type { KundliResponse } from "@/lib/types";
import {
  PLANET_ABBR, PLANET_COLOR, PLANET_ICON,
  type ChartData, type PlanetGlyph,
} from "@/lib/jyotish-ui";

// Lal Kitab "Teva": planets are placed in fixed houses equal to their sign
// (Aries = house 1 … Pisces = house 12). Remedy guidance below is original,
// written in the spirit of Lal Kitab rather than reproducing specific remedies.

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

const REMEDY_NOTE: Record<string, string> = {
  Sun: "Keep relations with your father and elders warm; offer water to the morning Sun; lead without arrogance.",
  Moon: "Honour your mother; keep water and silver vessels clean at home; care for those who need comfort.",
  Mars: "Channel your energy into honest effort; support your brothers; step back from needless quarrels.",
  Mercury: "Be truthful in speech and accounts; look after green plants; respect the girls and women of the family.",
  Jupiter: "Respect teachers and the wise; support learning and places of worship; share knowledge freely.",
  Venus: "Live cleanly and modestly; be devoted to your partner; avoid over-indulgence and luxury for its own sake.",
  Saturn: "Serve workers and the needy; be disciplined, patient and fair; never gain through deceit.",
  Rahu: "Avoid shortcuts, gambling and intoxicants; keep your conduct clean; help the overlooked.",
  Ketu: "Care for dogs, support children, and cultivate detachment and devotion.",
};

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30); // 0..11

export interface LalKitabPlanet {
  planet: string;
  house: number; // 1..12 (= sign)
  note: string;
}

export interface LalKitabDebt {
  name: string;
  present: boolean;
  reason: string;
}

export interface LalKitabResult {
  chart: ChartData;
  planets: LalKitabPlanet[];
  debts: LalKitabDebt[];
}

function glyph(name: string): PlanetGlyph {
  return {
    abbr: PLANET_ABBR[name] ?? name.slice(0, 2),
    color: PLANET_COLOR[name] ?? "#212121",
    icon: PLANET_ICON[name],
  };
}

export function getLalKitab(data: KundliResponse): LalKitabResult {
  const k = data.kundli;
  const houseOf: Record<string, number> = {};
  for (const p of PLANETS) houseOf[p] = signOf(k.planets[p].longitude) + 1;

  // Build the fixed-house (Aries = 1) chart.
  const houses: Record<number, PlanetGlyph[]> = {};
  for (let i = 1; i <= 12; i++) houses[i] = [];
  for (const p of PLANETS) houses[houseOf[p]].push(glyph(p));
  const chart: ChartData = { ascRashi: 1, houses };

  const planets: LalKitabPlanet[] = PLANETS.map((p) => ({
    planet: p,
    house: houseOf[p],
    note: REMEDY_NOTE[p],
  }));

  // Indicative ancestral-debt (Rin) checks — transparent, simplified rules.
  const sameHouse = (a: string, malefics: string[]) =>
    malefics.some((m) => houseOf[a] === houseOf[m]);

  const debts: LalKitabDebt[] = [
    {
      name: "Pitru Rin (ancestors / father)",
      present: sameHouse("Sun", ["Rahu", "Ketu", "Saturn"]) || houseOf["Rahu"] === 9,
      reason: "Sun joined by Rahu, Ketu or Saturn, or Rahu in the 9th house.",
    },
    {
      name: "Matru Rin (mother)",
      present: sameHouse("Moon", ["Rahu", "Ketu", "Saturn"]) || houseOf["Ketu"] === 4,
      reason: "Moon joined by Rahu, Ketu or Saturn, or Ketu in the 4th house.",
    },
    {
      name: "Stri / Relationship Rin",
      present: sameHouse("Venus", ["Rahu", "Ketu"]) ,
      reason: "Venus joined by Rahu or Ketu.",
    },
    {
      name: "Self / Conduct Rin",
      present: sameHouse("Mercury", ["Rahu", "Ketu"]),
      reason: "Mercury joined by Rahu or Ketu.",
    },
  ];

  return { chart, planets, debts };
}
