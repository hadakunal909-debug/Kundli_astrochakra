import { rashiNames } from "../core/constants";

/**
 * Ashtakavarga (Parashari).
 *
 * For each of the seven classical planets, the Bhinnashtakavarga (BAV) records,
 * sign by sign, how many benefic points (bindus) the planet earns. Each bindu is
 * contributed by one of eight reference points — the seven planets plus the
 * Lagna — when that planet/Lagna falls a "benefic" number of houses away.
 *
 * BENEFIC[planet][contributor] lists the house numbers (1 = the contributor's own
 * sign … 12) that receive a bindu. These are the standard BPHS benefic-place
 * tables; their per-planet totals are the classical 48/49/39/54/56/52/39 (337 sum).
 *
 * Sarvashtakavarga (SAV) sums the seven BAVs per sign (total 337).
 */

export interface AshtakavargaResult {
  /** planet name -> 12 bindus, indexed by sign (0 = Aries … 11 = Pisces). */
  bav: Record<string, number[]>;
  /** per-planet bindu totals (e.g. Sun = 48). */
  bavTotals: Record<string, number>;
  /** Sarvashtakavarga: 12 totals, one per sign (0 = Aries). Sums to 337. */
  sav: number[];
  /** Convenience: per-sign sign names aligned with the arrays. */
  signNames: string[];
}

const AV_PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

const CONTRIBUTORS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Lagna",
];

const BENEFIC: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11],
  },
};

function signOf(longitude: number): number {
  return Math.floor((((longitude % 360) + 360) % 360) / 30);
}

/**
 * Compute Bhinna- and Sarva-ashtakavarga.
 * @param planets  map of planet name -> { longitude } (sidereal). Needs the seven classical planets.
 * @param lagnaLongitude sidereal longitude of the ascendant.
 */
export function getAshtakavarga(
  planets: Record<string, { longitude: number }>,
  lagnaLongitude: number,
): AshtakavargaResult {
  const contribSign: Record<string, number> = {
    Lagna: signOf(lagnaLongitude),
  };
  for (const p of AV_PLANETS) {
    contribSign[p] = signOf(planets[p].longitude);
  }

  const bav: Record<string, number[]> = {};
  const bavTotals: Record<string, number> = {};
  const sav: number[] = new Array(12).fill(0);

  for (const planet of AV_PLANETS) {
    const arr: number[] = new Array(12).fill(0);
    for (const c of CONTRIBUTORS) {
      const cSign = contribSign[c];
      for (const h of BENEFIC[planet][c]) {
        const s = (cSign + (h - 1)) % 12;
        arr[s] += 1;
      }
    }
    bav[planet] = arr;
    bavTotals[planet] = arr.reduce((a, b) => a + b, 0);
    for (let s = 0; s < 12; s++) sav[s] += arr[s];
  }

  return { bav, bavTotals, sav, signNames: rashiNames.slice(0, 12) };
}
