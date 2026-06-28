import { rashiNames } from "../core/constants";
import { RASHI_LORDS } from "../matching/constants";

/**
 * Bhavat Bhavam ("house from house"). Each house is reinforced by the house that is as
 * far from it as it is from the lagna: the H-th house from the H-th house = the (2H−1)th
 * house. This module computes, per house, the chart-specific picture of that pair — signs,
 * lords, where each lord sits, and which grahas tenant the two houses — so the report can
 * speak to the actual chart instead of a generic mapping.
 */

const GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const BENEFICS = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
const KENDRA = new Set([1, 4, 7, 10]);
const TRIKONA = new Set([1, 5, 9]);
const DUSTHANA = new Set([6, 8, 12]);

const HOUSE_SIGNIFICATIONS = [
  "self, body and personality",
  "wealth, family and speech",
  "siblings, courage and effort",
  "home, mother and inner peace",
  "children, intellect and romance",
  "health, debts and adversaries",
  "spouse and partnerships",
  "longevity, change and the hidden",
  "fortune, dharma and father",
  "career, status and action",
  "gains, networks and aspirations",
  "expenses, loss and liberation",
];

export interface BhavatBhavamHouse {
  house: number;
  significations: string;
  sign: number; // 1..12
  signName: string;
  lord: string;
  lordHouse: number; // house the lord occupies
  planetsInHouse: string[];
  bbHouse: number; // reinforcing house (2H-1)
  bbSign: number;
  bbSignName: string;
  bbLord: string;
  bbLordHouse: number;
  planetsInBbHouse: string[];
  note: string; // factual, chart-specific summary
}

export interface BhavatBhavamResult {
  houses: BhavatBhavamHouse[];
}

const norm = (x: number): number => ((x % 360) + 360) % 360;

export function getBhavatBhavam(
  planets: Record<string, { longitude: number }>,
  lagnaLon: number,
): BhavatBhavamResult {
  const lagnaSign0 = Math.floor(norm(lagnaLon) / 30);
  const houseOf = (sign0: number) => ((sign0 - lagnaSign0 + 12) % 12) + 1;

  // Bucket grahas into houses (whole-sign, as Bhavat Bhavam is read from the rasi chart).
  const tenants: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) tenants[h] = [];
  for (const g of GRAHAS) {
    const p = planets[g];
    if (!p) continue;
    tenants[houseOf(Math.floor(norm(p.longitude) / 30))].push(g);
  }

  const houses: BhavatBhavamHouse[] = [];
  for (let h = 1; h <= 12; h++) {
    const sign0 = (lagnaSign0 + (h - 1)) % 12;
    const lord = RASHI_LORDS[sign0];
    const lordHouse = houseOf(Math.floor(norm(planets[lord]?.longitude ?? 0) / 30));

    const bbHouse = ((2 * h - 2) % 12) + 1;
    const bbSign0 = (lagnaSign0 + (bbHouse - 1)) % 12;
    const bbLord = RASHI_LORDS[bbSign0];
    const bbLordHouse = houseOf(Math.floor(norm(planets[bbLord]?.longitude ?? 0) / 30));

    houses.push({
      house: h,
      significations: HOUSE_SIGNIFICATIONS[h - 1],
      sign: sign0 + 1,
      signName: rashiNames[sign0],
      lord,
      lordHouse,
      planetsInHouse: tenants[h],
      bbHouse,
      bbSign: bbSign0 + 1,
      bbSignName: rashiNames[bbSign0],
      bbLord,
      bbLordHouse,
      planetsInBbHouse: tenants[bbHouse],
      note: buildNote(h, lord, lordHouse, tenants[h], bbHouse, tenants[bbHouse]),
    });
  }

  return { houses };
}

function placementWord(houseNum: number): string {
  if (TRIKONA.has(houseNum)) return "a trine (strong)";
  if (KENDRA.has(houseNum)) return "an angle (strong)";
  if (DUSTHANA.has(houseNum)) return "a difficult house";
  return "a neutral house";
}

function buildNote(
  h: number,
  lord: string,
  lordHouse: number,
  inHouse: string[],
  bbHouse: number,
  inBb: string[],
): string {
  const parts: string[] = [];
  parts.push(`Lord ${lord} sits in house ${lordHouse} — ${placementWord(lordHouse)}.`);

  const pair = [...new Set([...inHouse, ...inBb])];
  if (h === bbHouse) {
    parts.push(inHouse.length ? `Tenanted by ${inHouse.join(", ")}.` : "No grahas tenant it.");
  } else if (pair.length) {
    const benefics = pair.filter((g) => BENEFICS.has(g));
    const malefics = pair.filter((g) => !BENEFICS.has(g));
    parts.push(
      `The pair (houses ${h} & ${bbHouse}) is held by ${pair.join(", ")}` +
        (benefics.length && malefics.length
          ? ` — mixed benefic/malefic influence.`
          : benefics.length
          ? ` — benefic support.`
          : ` — malefic pressure.`),
    );
  } else {
    parts.push(`Houses ${h} & ${bbHouse} hold no grahas; judge them through their lords.`);
  }
  return parts.join(" ");
}
