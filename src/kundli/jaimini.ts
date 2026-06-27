import { rashiNames } from "../core/constants";
import { RASHI_LORDS } from "../matching/constants";
import { VargaChart } from "./types";

/**
 * Jaimini essentials: the seven Chara Karakas (planets ranked by the degrees
 * they have advanced within their sign), the Karakamsa (the Atmakaraka's
 * Navamsa sign), and the Arudha / Upapada Lagna (reflected ascendants).
 */

const KARAKA_NAMES = [
  "Atmakaraka (AK · soul)",
  "Amatyakaraka (AmK · career)",
  "Bhratrikaraka (BK · siblings)",
  "Matrikaraka (MK · mother)",
  "Pitrikaraka (PiK · father)",
  "Gnatikaraka (GK · kin)",
  "Darakaraka (DK · spouse)",
];

const KARAKA_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export interface CharaKaraka {
  karaka: string;
  planet: string;
  degree: number; // degrees advanced within the sign
}

export interface JaiminiReport {
  karakas: CharaKaraka[];
  atmakaraka: string;
  karakamsa: string;     // AK's Navamsa sign
  arudhaLagna: string;
  upapadaLagna: string;
}

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const degInSign = (lon: number) => norm(lon) % 30;

/** Arudha of a house: reflect the house's lord the same distance again, with the
 *  classic exceptions when the pada falls in the 1st or 7th from the house. */
function arudha(houseSign0: number, lordSign0: number): number {
  let a = (2 * lordSign0 - houseSign0 + 24) % 12;
  if (a === houseSign0 || a === (houseSign0 + 6) % 12) {
    a = (a + 9) % 12; // take the 10th from it
  }
  return a;
}

export function getJaimini(
  planets: Record<string, { longitude: number }>,
  lagnaLongitude: number,
  vargas?: Record<string, VargaChart>,
): JaiminiReport {
  // Chara Karakas — rank the 7 planets by degrees advanced within their sign.
  const ranked = KARAKA_PLANETS
    .filter((p) => planets[p])
    .map((p) => ({ planet: p, degree: degInSign(planets[p].longitude) }))
    .sort((a, b) => b.degree - a.degree);

  const karakas: CharaKaraka[] = ranked.map((r, i) => ({
    karaka: KARAKA_NAMES[i] ?? `Karaka ${i + 1}`,
    planet: r.planet,
    degree: r.degree,
  }));
  const atmakaraka = ranked[0]?.planet ?? "Sun";

  // Karakamsa — the Navamsa sign occupied by the Atmakaraka.
  let karakamsa = "—";
  const d9 = vargas?.d9;
  if (d9 && d9.planets[atmakaraka]) {
    karakamsa = d9.planets[atmakaraka].rashiName;
  }

  // Arudha Lagna (from the 1st) and Upapada Lagna (from the 12th).
  const lagnaSign = signOf(lagnaLongitude);
  const lagnaLord = RASHI_LORDS[lagnaSign];
  const al = arudha(lagnaSign, signOf(planets[lagnaLord].longitude));

  const twelfth = (lagnaSign + 11) % 12;
  const twelfthLord = RASHI_LORDS[twelfth];
  const ul = arudha(twelfth, signOf(planets[twelfthLord].longitude));

  return {
    karakas,
    atmakaraka,
    karakamsa,
    arudhaLagna: rashiNames[al],
    upapadaLagna: rashiNames[ul],
  };
}
