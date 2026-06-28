import { rashiNames } from "../core/constants";
import { Body } from "astronomy-engine";
import { VargaChart, Bhava } from "./types";
import { getHouses } from "./houses";

// --- Helper for creating full Chart ---
function createVargaChart(
  ascendantLength: number,
  planets: Record<string, { longitude: number }>,
  calculationFn: (lon: number) => number,
): VargaChart {
  const ascRashi = calculationFn(ascendantLength);
  const dPlanets: Record<string, { rashi: number; rashiName: string }> = {};

  for (const [name, data] of Object.entries(planets)) {
    const sign = calculationFn(data.longitude);
    dPlanets[name] = { rashi: sign + 1, rashiName: rashiNames[sign] };
  }

  // Assign planets to Houses (Whole Sign System for Vargas)
  // House 1 is the sign of the Ascendant.
  const ascDegree = ascRashi * 30 + 15;
  const houses = getHouses(ascDegree, "whole_sign");

  for (const [pName, pData] of Object.entries(dPlanets)) {
    const pRashi = pData.rashi;
    const house = houses.find((h: Bhava) => h.rashi === pRashi);
    if (house) house.planets.push(pName);
  }

  return {
    ascendant: { rashi: ascRashi + 1, rashiName: rashiNames[ascRashi] },
    planets: dPlanets,
    houses: houses,
  };
}

// --- D1 (Rashi): The main birth chart, covering overall physical appearance, health, and life's direction.
function getRashiSign(longitude: number): number {
  return Math.floor(longitude / 30);
}

// --- D-2 (Hora): Wealth and accumulated resources.
// Parashara Hora: Odd Signs (0-15° = Sun/Leo, 15-30° = Moon/Cancer)
// Even Signs (0-15° = Moon/Cancer, 15-30° = Sun/Leo)
function getHoraSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;
  const isOdd = rashi % 2 === 0; // 0=Aries (Odd)

  if (isOdd) {
    return degrees < 15 ? 4 : 3; // Leo(4), Cancer(3)
  } else {
    return degrees < 15 ? 3 : 4; // Cancer(3), Leo(4)
  }
}

// --- D-3 (Drekkana): Co-borns (siblings), courage, and happiness.
// 0-10: Same Sign, 10-20: 5th, 20-30: 9th
function getDrekkanaSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;

  if (degrees < 10) return rashi;
  if (degrees < 20) return (rashi + 4) % 12;
  return (rashi + 8) % 12;
}

// --- D-4 (Chaturthamsha): Fixed assets, land, and overall luck. ---
function getChaturthamshaSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;
  const part = Math.floor(degrees / 7.5);
  return (rashi + part * 3) % 12;
}

// --- D-7 (Saptamansha): Children, grandchildren, and creative projects. ---
function getSaptamsaSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;
  const part = Math.floor(degrees / (30 / 7)); // 0 to 6
  const isOdd = rashi % 2 === 0;

  if (isOdd) {
    return (rashi + part) % 12;
  } else {
    const startSign = (rashi + 6) % 12;
    return (startSign + part) % 12;
  }
}

// --- D-9 (Navamsa): Spouse, married life, and ultimate strength of planets. ---
export function getNavamsaSign(longitude: number): number {
  const navamsaSpan = 360 / 108;
  const index = Math.floor(longitude / navamsaSpan);
  return index % 12;
}

// --- D-10 (Dashamsha): Career, professional achievements, and status. ---
function getDasamsaSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;
  const part = Math.floor(degrees / 3);
  const isOdd = rashi % 2 === 0;

  if (isOdd) {
    return (rashi + part) % 12;
  } else {
    const startSign = (rashi + 8) % 12;
    return (startSign + part) % 12;
  }
}

// --- D-12 (Dwadashamsha): Parents, ancestors, and lineage. ---
function getDwadasamsaSign(longitude: number): number {
  const rashi = Math.floor(longitude / 30);
  const degrees = longitude % 30;
  const part = Math.floor(degrees / 2.5);
  return (rashi + part) % 12;
}

// --- D-16 (Shodashamsha): Vehicles, luxuries, and pleasures. ---
// 0-2.5: Same Sign, 2.5-5: 2nd, 5-7.5: 3rd, ..., 22.5-25: 9th, 25-27.5: 10th, 27.5-30: 11th
function getShodasamsaSign(longitude: number): number {
  const signNumber = Math.floor(longitude / 30); // 0-11
  const degreeInSign = longitude % 30;
  const part = Math.floor(degreeInSign / 1.875); // 0-15

  let startSign;
  // Determine start sign based on Rasi Type
  if ([0, 3, 6, 9].includes(signNumber))
    startSign = 0; // Movable
  else if ([1, 4, 7, 10].includes(signNumber))
    startSign = 4; // Fixed
  else startSign = 8; // Dual

  // Calculate D16 sign (0-11)
  let d16Sign = (startSign + part) % 12;
  return d16Sign; // 0=Aries, 1=Taurus, etc.
}

// --- D-20 (Vimshamsha): Spiritual practices, belief systems, and auspiciousness. ---
function getVimsamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30); // 0-11
  const degreesInSign = longitude % 30;
  const division = Math.floor(degreesInSign / 1.5) + 1; // 1-20

  // Sign types: Movable (0,3,6,9), Fixed (1,4,7,10), Dual (2,5,8,11)
  let startSign;
  if (sign % 3 === 0)
    startSign = 0; // Movable -> Aries (0)
  else if (sign % 3 === 1)
    startSign = 8; // Fixed -> Sagittarius (8)
  else startSign = 4; // Dual -> Leo (4)

  // Calculate final sign (0-11)
  let finalSign = (startSign + (division - 1)) % 12;

  return finalSign;
}

// ---D-24 (Chaturvimshamsha): Education, learning, and academic success. ---
function getChaturvimshamsaSign(longitude: number): number {
  const signNumber = Math.floor(longitude / 30); // 0-11
  const degreeInSign = longitude % 30; // 0-29.99

  // Each part is 1.25 degrees (30 / 24)
  const division = Math.floor(degreeInSign / 1.25); // 0-23

  let d24Sign;
  // Odd sign (0=Aries, 2=Gemini, 4=Leo, 6=Libra, 8=Sag, 10=Aqua)
  if (signNumber % 2 === 0) {
    // Starts from Leo (4)
    d24Sign = (4 + division) % 12;
  }
  // Even sign (1=Taurus, 3=Cancer, 5=Virgo, 7=Scorpio, 9=Cap, 11=Pisces)
  else {
    // Starts from Cancer (3)
    d24Sign = (3 + division) % 12;
  }

  return d24Sign;
}

// --- D-27 (Saptavimshamsha): Strength, weaknesses, and general endurance. ---
function getSaptavimshamshaSign(longitude: number): number {
  const rashiIndex = Math.floor(longitude / 30);
  const degreeInRashi = longitude % 30;

  // 2. Determine the division (1-27)
  const divisionSize = 30 / 27; // 1.111111...
  let division = Math.floor(degreeInRashi / divisionSize) + 1;
  if (division > 27) division = 27; // Handle precision edge case

  // 3. Determine starting sign based on nature
  // Fiery:0,4,8 | Earthy:1,5,9 | Airy:2,6,10 | Watery:3,7,11
  let startSign;
  if ([0, 4, 8].includes(rashiIndex))
    startSign = 0; // Aries
  else if ([1, 5, 9].includes(rashiIndex))
    startSign = 3; // Cancer
  else if ([2, 6, 10].includes(rashiIndex))
    startSign = 6; // Libra
  else startSign = 9; // Capricorn

  // 4. Calculate Final D27 Sign
  let d27Sign = (startSign + division - 1) % 12;

  return d27Sign;
}

// --- D-30 (Trimshamsha): Misfortunes, obstacles, and debts. ---
function getTrimshamshaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30);
  const degree = longitude % 30;
  const division = Math.floor(degree) + 1; // 1 to 30
  const isOddSign = (sign % 2) === 0; // 0=Aries (Odd), 1=Taurus (Even), etc.

  let d30Sign;

  if (isOddSign) {
    // Odd Sign: Mars, Saturn, Jupiter, Mercury, Venus (5-5-8-7-5 or 5-5-5-5-5 variations exist)
    // Standard 5-5-8-7-5 mapping (degrees):
    if (division <= 5) d30Sign = 0;      // Mars (Aries)
    else if (division <= 10) d30Sign = 10; // Saturn (Aquarius)
    else if (division <= 18) d30Sign = 8;  // Jupiter (Sagittarius)
    else if (division <= 25) d30Sign = 2;  // Mercury (Gemini)
    else d30Sign = 6;                      // Venus (Libra)
  } else {
    // Even Sign: Venus, Mercury, Jupiter, Saturn, Mars (Reverse)
    if (division <= 5) d30Sign = 6;       // Venus (Libra)
    else if (division <= 12) d30Sign = 2; // Mercury (Gemini)
    else if (division <= 20) d30Sign = 8; // Jupiter (Sagittarius)
    else if (division <= 25) d30Sign = 10; // Saturn (Aquarius)
    else d30Sign = 0;                     // Mars (Aries)
  }

  return d30Sign; // Returns 0-11
}



// --- D-40 (Khavedamsha): Auspicious and inauspicious effects, specifically concerning maternal lineage. ---
export function getKhavedamshaSign(longitude: number): number {
  // normalize to [0, 360)
  const lon = ((longitude % 360) + 360) % 360;

  // which rashi (0..11)
  const rashi = Math.floor(lon / 30);

  // degrees inside the rashi (0 <= d < 30)
  const within = lon - rashi * 30;

  // each khavedamsha = 0.75 degrees
  const partSize = 0.75;

  // division number 1..40
  const division = Math.min(40, Math.floor(within / partSize) + 1);

  // start sign: odd rashi indices -> start from Aries(0). even -> start from Libra(6).
  // (Here "odd" means 1st,3rd,... in human counting; in zero-based index it's indices 0,2,4,...)
  const isOddRashiZeroBased = (rashi % 2 === 0);
  const startSign = isOddRashiZeroBased ? 0 : 6;

  // compute target D40 rashi (0..11)
  const d40 = (startSign + (division - 1)) % 12;

  return d40;
}



// --- D-45 (Akshavedamsha): Overall character, reputation, and general well-being. ---
export function getAkshavedamshaSign(longitude: number): number {
  let sign = Math.floor(longitude / 30);
  let longWithinSign = longitude % 30;

  // 2. Find the 40-minute division (0-44)
  let division = Math.floor(longWithinSign / (40 / 60));

  // 3. Determine starting sign based on Rasi nature
  let startSign;
  if ([0, 3, 6, 9].includes(sign)) { // Movable (Mesha, etc.)
    startSign = 0; // Starts from Aries
  } else if ([1, 4, 7, 10].includes(sign)) { // Fixed (Taurus, etc.)
    startSign = 4; // Starts from Leo
  } else { // Dual (Gemini, etc.)
    startSign = 8; // Starts from Sagittarius
  }

  // 4. Calculate Final Sign (0-11)
  let finalSign = (startSign + division) % 12;

  return finalSign;
}



// --- D-60 (Shashtyamsha): Past life karma and deep, minute karmic patterns. --- 
export function getShastiamsaSign(longitude: number): number {
  // 1. Normalize longitude to 0-360
  const normalized = ((longitude % 360) + 360) % 360;

  const signIndex = Math.floor(normalized / 30); // 0–11
  const degreeInSign = normalized % 30;

  // Each sign divided into 60 parts → 0.5° each
  const part = Math.floor(degreeInSign / 0.5); // 0–59

  // Odd signs: Aries(0), Gemini(2), Leo(4), Libra(6), Sagittarius(8), Aquarius(10)
  const isOdd = signIndex % 2 === 0;

  let result;

  if (isOdd) {
    // Forward count
    result = (signIndex + part) % 12;
  } else {
    // Even signs: backward from 9th sign
    result = (signIndex + 8 - part) % 12;
  }

  // Ensure positive 0–11
  return (result + 12) % 12;
}



// --- Generic divisional sign (cyclic / Parivritti scheme) ---
// Used for every division that has no special classical rule (D5, D6, D8, D11, …).
// The 30° sign is split into N equal parts; divisions are counted continuously from
// 0° Aries, so the Dn sign = (signIndex * N + part) mod 12.
function getCyclicSign(longitude: number, n: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(lon / 30);
  const deg = lon % 30;
  const part = Math.floor(deg / (30 / n));
  return (sign * n + part) % 12;
}

// Classical charts keep their traditional rules; everything else uses the cyclic rule.
const SPECIAL_VARGAS: Record<number, (lon: number) => number> = {
  1: getRashiSign,
  2: getHoraSign,
  3: getDrekkanaSign,
  4: getChaturthamshaSign,
  7: getSaptamsaSign,
  9: getNavamsaSign,
  10: getDasamsaSign,
  12: getDwadasamsaSign,
  16: getShodasamsaSign,
  20: getVimsamsaSign,
  24: getChaturvimshamsaSign,
  27: getSaptavimshamshaSign,
  30: getTrimshamshaSign,
  40: getKhavedamshaSign,
  45: getAkshavedamshaSign,
  60: getShastiamsaSign,
};

// --- Main Export ---
// Computes every divisional chart from D1 to D60. The classical Shodasavarga charts
// use their traditional formulas; the remaining divisions use the cyclic rule.
export function getAllVargas(
  ascendantLength: number,
  planets: Record<string, { longitude: number }>,
): Record<string, VargaChart> {
  const out: Record<string, VargaChart> = {};
  for (let n = 1; n <= 60; n++) {
    const fn = SPECIAL_VARGAS[n] ?? ((lon: number) => getCyclicSign(lon, n));
    out[`d${n}`] = createVargaChart(ascendantLength, planets, fn);
  }
  return out;
}

// Keep the old single export for backward compatibility or direct use if needed,
// though getAllVargas covers it.
export function getNavamsaChart(
  ascendantLength: number,
  planets: Record<string, { longitude: number }>,
): VargaChart {
  return createVargaChart(ascendantLength, planets, getNavamsaSign);
}
