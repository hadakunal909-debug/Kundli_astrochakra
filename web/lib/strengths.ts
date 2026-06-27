import type { KundliResponse } from "@/lib/types";

// Panchadha (five-fold) planetary friendship = natural + temporal combined.

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

const NAT_FRIEND: Record<string, string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const NAT_ENEMY: Record<string, string[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

const signOf = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

function naturalValue(a: string, b: string): number {
  if (NAT_FRIEND[a]?.includes(b)) return 1;
  if (NAT_ENEMY[a]?.includes(b)) return -1;
  return 0;
}

// Temporal: planets 2,3,4,10,11,12 from a planet are its temporal friends.
function temporalValue(aSign: number, bSign: number): number {
  const house = ((bSign - aSign + 12) % 12) + 1;
  return [2, 3, 4, 10, 11, 12].includes(house) ? 1 : -1;
}

const LABEL: Record<number, string> = {
  2: "Great Friend",
  1: "Friend",
  0: "Neutral",
  [-1]: "Enemy",
  [-2]: "Great Enemy",
};

export interface FriendshipResult {
  planets: string[];
  matrix: Record<string, Record<string, string>>;
}

export function getFriendship(data: KundliResponse): FriendshipResult {
  const k = data.kundli;
  const sign: Record<string, number> = {};
  for (const p of PLANETS) sign[p] = signOf(k.planets[p].longitude);

  const matrix: Record<string, Record<string, string>> = {};
  for (const a of PLANETS) {
    matrix[a] = {};
    for (const b of PLANETS) {
      if (a === b) {
        matrix[a][b] = "—";
        continue;
      }
      const v = naturalValue(a, b) + temporalValue(sign[a], sign[b]);
      matrix[a][b] = LABEL[v] ?? "Neutral";
    }
  }
  return { planets: PLANETS, matrix };
}
