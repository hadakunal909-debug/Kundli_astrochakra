import { nakshatraNames } from "./constants";

/**
 * Yogini Dasha — an eight-fold cycle of 36 years. Each Yogini rules a fixed
 * number of years and is tied to a planet. The starting Yogini comes from the
 * birth nakshatra, and (like Vimshottari) the first period is the balance of
 * that Yogini left at birth.
 */

const YOGINIS: { name: string; years: number; lord: string }[] = [
  { name: "Mangala", years: 1, lord: "Moon" },
  { name: "Pingala", years: 2, lord: "Sun" },
  { name: "Dhanya", years: 3, lord: "Jupiter" },
  { name: "Bhramari", years: 4, lord: "Mars" },
  { name: "Bhadrika", years: 5, lord: "Mercury" },
  { name: "Ulka", years: 6, lord: "Saturn" },
  { name: "Siddha", years: 7, lord: "Venus" },
  { name: "Sankata", years: 8, lord: "Rahu" },
];

const TOTAL_YEARS = 36;
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const NAK_SPAN = 360 / 27;

export interface YoginiPeriod {
  yogini: string;
  lord: string;
  startTime: Date;
  endTime: Date;
  antars?: YoginiPeriod[];
}

export interface YoginiDashaResult {
  startYogini: string;
  birthNakshatra: string;
  periods: YoginiPeriod[];
}

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const addYears = (d: Date, y: number) => new Date(d.getTime() + y * MS_PER_YEAR);

/** Antardashas of a Yogini period — all eight Yoginis in order, proportional. */
function antarsOf(startIdx: number, start: Date, end: Date): YoginiPeriod[] {
  const span = end.getTime() - start.getTime();
  const out: YoginiPeriod[] = [];
  let t = start.getTime();
  for (let i = 0; i < 8; i++) {
    const y = YOGINIS[(startIdx + i) % 8];
    const d = span * (y.years / TOTAL_YEARS);
    out.push({ yogini: y.name, lord: y.lord, startTime: new Date(t), endTime: new Date(t + d) });
    t += d;
  }
  return out;
}

export function getYoginiDasha(
  moonLongitude: number,
  birthDate: Date,
  asOf: Date = new Date(),
): YoginiDashaResult {
  const lon = norm(moonLongitude);
  const nakIndex = Math.floor(lon / NAK_SPAN); // 0..26
  const fractionRemaining = 1 - (lon - nakIndex * NAK_SPAN) / NAK_SPAN;

  // Starting Yogini: (nakshatra number + 3) mod 8, with 0 mapping to the 8th.
  const rem = (nakIndex + 1 + 3) % 8;
  let startIdx = (rem === 0 ? 8 : rem) - 1;

  const periods: YoginiPeriod[] = [];
  let cursor = new Date(birthDate.getTime());

  // First (partial) Yogini = the balance left at birth.
  let first = YOGINIS[startIdx];
  let end = addYears(cursor, first.years * fractionRemaining);
  periods.push({
    yogini: first.name,
    lord: first.lord,
    startTime: new Date(cursor),
    endTime: end,
    antars: antarsOf(startIdx, new Date(cursor), end),
  });
  cursor = end;

  // Following full Yoginis until we pass the asOf date (at least one full cycle).
  let i = 1;
  while (cursor < asOf || i <= 8) {
    const idx = (startIdx + i) % 8;
    const y = YOGINIS[idx];
    end = addYears(cursor, y.years);
    periods.push({
      yogini: y.name,
      lord: y.lord,
      startTime: new Date(cursor),
      endTime: end,
      antars: antarsOf(idx, new Date(cursor), end),
    });
    cursor = end;
    i++;
    if (i > 24) break; // safety
  }

  return {
    startYogini: YOGINIS[startIdx].name,
    birthNakshatra: nakshatraNames[nakIndex],
    periods,
  };
}
