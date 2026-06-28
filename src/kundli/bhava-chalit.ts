import { rashiNames } from "../core/constants";

/**
 * Bhava Chalit chart. Unlike the Rashi (D1) chart — where a whole sign is one house —
 * the Chalit places each planet into the *bhava* (house) it actually falls in, using
 * equal houses centred on the ascendant degree (the 1st house spans asc−15° … asc+15°).
 * A planet near a sign boundary can therefore sit in a different house here than in D1.
 */

export interface BhavaChalitPlanet {
  name: string;
  longitude: number;
  rashi: number; // 1 = Aries … 12 = Pisces
  rashiName: string;
  bhava: number; // chalit house, 1..12
  rashiHouse: number; // whole-sign house in the D1 chart, 1..12
  shifted: boolean; // bhava differs from the rashi-chart house
}

export interface BhavaChalitResult {
  ascRashi: number; // lagna sign, 1..12
  planets: BhavaChalitPlanet[];
}

const norm = (x: number): number => ((x % 360) + 360) % 360;

export function getBhavaChalit(
  planets: Record<string, { longitude: number }>,
  lagnaLon: number,
): BhavaChalitResult {
  const lagnaSign0 = Math.floor(norm(lagnaLon) / 30);
  const firstCusp = norm(lagnaLon - 15); // start of the 1st bhava (asc at its midpoint)

  const out: BhavaChalitPlanet[] = [];
  for (const [name, p] of Object.entries(planets)) {
    const lon = norm(p.longitude);
    const sign0 = Math.floor(lon / 30);
    const bhava = Math.floor(norm(lon - firstCusp) / 30) + 1; // 1..12
    const rashiHouse = ((sign0 - lagnaSign0 + 12) % 12) + 1;
    out.push({
      name,
      longitude: lon,
      rashi: sign0 + 1,
      rashiName: rashiNames[sign0],
      bhava,
      rashiHouse,
      shifted: bhava !== rashiHouse,
    });
  }

  return { ascRashi: lagnaSign0 + 1, planets: out };
}
