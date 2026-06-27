import { Body } from "astronomy-engine";
import {
  getPlanetaryPosition,
  getRahuPosition,
  getKetuPosition,
} from "../core/calculations";
import { getAyanamsa } from "../core/ayanamsa";
import { rashiNames } from "../core/constants";

/**
 * Gochar (transit): where the planets are right now, in sidereal signs, and how
 * they fall relative to the natal Moon (the classic Vedic reference for transits).
 */

export interface TransitPlanet {
  planet: string;
  sign: string;
  signIndex: number;   // 0 = Aries … 11 = Pisces
  retrograde: boolean;
  houseFromMoon: number; // 1..12, counted from the natal Moon sign
}

export interface TransitReport {
  asOf: string;        // ISO date the transit was computed for
  moonSign: string;    // natal Moon sign (the reference)
  planets: TransitPlanet[];
}

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);

export function getTransit(
  natalMoonLongitude: number,
  asOf: Date = new Date(),
): TransitReport {
  const ayan = getAyanamsa(asOf);
  const moonSign0 = signOf(natalMoonLongitude);

  const bodies: [Body, string][] = [
    [Body.Sun, "Sun"],
    [Body.Moon, "Moon"],
    [Body.Mars, "Mars"],
    [Body.Mercury, "Mercury"],
    [Body.Jupiter, "Jupiter"],
    [Body.Venus, "Venus"],
    [Body.Saturn, "Saturn"],
  ];

  const planets: TransitPlanet[] = bodies.map(([body, name]) => {
    const pos = getPlanetaryPosition(body, asOf, ayan);
    const s0 = signOf(pos.longitude);
    return {
      planet: name,
      sign: rashiNames[s0],
      signIndex: s0,
      retrograde: !!pos.isRetrograde,
      houseFromMoon: ((s0 - moonSign0 + 12) % 12) + 1,
    };
  });

  // Nodes (always retrograde).
  const rahu = getRahuPosition(asOf, ayan);
  const ketu = getKetuPosition(rahu);
  for (const [name, pos] of [["Rahu", rahu], ["Ketu", ketu]] as const) {
    const s0 = signOf(pos.longitude);
    planets.push({
      planet: name,
      sign: rashiNames[s0],
      signIndex: s0,
      retrograde: true,
      houseFromMoon: ((s0 - moonSign0 + 12) % 12) + 1,
    });
  }

  return {
    asOf: asOf.toISOString(),
    moonSign: rashiNames[moonSign0],
    planets,
  };
}
