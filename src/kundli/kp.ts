import { rashiNames, nakshatraNames } from "../core/constants";
import { RASHI_LORDS } from "../matching/constants";
import { Bhava } from "./types";

/**
 * Krishnamurti Paddhati (KP) sub-lords. Each zodiac longitude is owned, in
 * descending order of size, by a Sign lord, a Star (nakshatra) lord, a Sub lord
 * and a Sub-sub lord. The star is one of 27 nakshatras; the sub divides each
 * nakshatra into nine unequal parts in Vimshottari order and proportion.
 */

const VIM_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const VIM_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]; // total 120
const NAK_SPAN = 360 / 27; // 13°20'

export interface KpLords {
  signLord: string;
  star: string;
  starLord: string;
  sub: string;
  subSub: string;
}

export interface KpRow extends KpLords {
  name: string;
  longitude: number;
  sign: string;
}

export interface KpReport {
  ascendant: KpRow;
  planets: KpRow[];
  cusps: (KpLords & { house: number; sign: string })[];
}

const norm = (lon: number) => ((lon % 360) + 360) % 360;

/** Sign / star / sub / sub-sub lord of any sidereal longitude. */
export function kpLordsOf(longitude: number): KpLords {
  const lon = norm(longitude);
  const signLord = RASHI_LORDS[Math.floor(lon / 30)];

  const nak = Math.floor(lon / NAK_SPAN); // 0..26
  const startIdx = nak % 9;
  const star = nakshatraNames[nak];
  const starLord = VIM_ORDER[startIdx];

  // Sub: walk Vimshottari order from the star lord, sizes proportional to years.
  const posInNak = lon - nak * NAK_SPAN;
  let acc = 0;
  let subIdx = startIdx;
  let subStart = 0;
  let subSize = NAK_SPAN;
  for (let i = 0; i < 9; i++) {
    const idx = (startIdx + i) % 9;
    const size = (VIM_YEARS[idx] / 120) * NAK_SPAN;
    if (posInNak < acc + size || i === 8) {
      subIdx = idx;
      subStart = acc;
      subSize = size;
      break;
    }
    acc += size;
  }
  const sub = VIM_ORDER[subIdx];

  // Sub-sub: walk again from the sub lord, proportional within the sub.
  const posInSub = posInNak - subStart;
  let acc2 = 0;
  let subSubIdx = subIdx;
  for (let i = 0; i < 9; i++) {
    const idx = (subIdx + i) % 9;
    const size = (VIM_YEARS[idx] / 120) * subSize;
    if (posInSub < acc2 + size || i === 8) {
      subSubIdx = idx;
      break;
    }
    acc2 += size;
  }
  const subSub = VIM_ORDER[subSubIdx];

  return { signLord, star, starLord, sub, subSub };
}

function row(name: string, longitude: number): KpRow {
  const lon = norm(longitude);
  return {
    name,
    longitude: lon,
    sign: rashiNames[Math.floor(lon / 30)],
    ...kpLordsOf(lon),
  };
}

const PLANET_ORDER = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

export function getKp(
  planets: Record<string, { longitude: number }>,
  lagnaLongitude: number,
  houses: Bhava[],
): KpReport {
  const planetRows = PLANET_ORDER
    .filter((p) => planets[p])
    .map((p) => row(p, planets[p].longitude));

  const cusps = houses
    .filter((h) => h.number >= 1 && h.number <= 12)
    .sort((a, b) => a.number - b.number)
    .map((h) => {
      const lon = norm(h.startLongitude);
      return {
        house: h.number,
        sign: rashiNames[Math.floor(lon / 30)],
        ...kpLordsOf(lon),
      };
    });

  return {
    ascendant: row("Ascendant", lagnaLongitude),
    planets: planetRows,
    cusps,
  };
}
