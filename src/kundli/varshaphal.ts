import { Observer, Body } from "astronomy-engine";
import {
  getUdayaLagna,
  getPlanetaryPosition,
  getRahuPosition,
  getKetuPosition,
} from "../core/calculations";
import { getAyanamsa } from "../core/ayanamsa";
import { rashiNames } from "../core/constants";
import { RASHI_LORDS } from "../matching/constants";

/**
 * Varshaphal (Tajika annual chart). The "Varsha Pravesh" is the moment each year
 * when the Sun returns to its exact natal (sidereal) longitude; a chart cast for
 * that instant governs the year. We also give the Muntha (the natal Ascendant
 * advanced one sign per completed year) and an indicative year lord.
 */

export interface AnnualPlanet {
  planet: string;
  sign: string;
}

export interface AnnualChart {
  year: number;
  varshaPravesh: string;   // ISO instant of the solar return
  ascendant: string;       // annual (Varsha) Lagna sign
  muntha: { sign: string; house: number };
  yearLord: string;        // indicative (Muntha lord)
  planets: AnnualPlanet[];
}

export interface VarshaphalReport {
  charts: AnnualChart[];
}

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const DEG_PER_DAY = 0.98565; // mean solar motion

function sunSidereal(date: Date): number {
  return norm(getPlanetaryPosition(Body.Sun, date, getAyanamsa(date)).longitude);
}

/** Find the instant in `year` when the sidereal Sun equals `targetLon`. */
function solarReturn(targetLon: number, year: number, seed: Date): Date {
  // Start near the birthday in the requested year.
  let t = new Date(Date.UTC(year, seed.getUTCMonth(), seed.getUTCDate(), seed.getUTCHours(), seed.getUTCMinutes()));
  for (let i = 0; i < 10; i++) {
    const cur = sunSidereal(t);
    let diff = ((targetLon - cur + 540) % 360) - 180; // shortest signed gap in degrees
    if (Math.abs(diff) < 1e-4) break;
    t = new Date(t.getTime() + (diff / DEG_PER_DAY) * 86400000);
  }
  return t;
}

const BODIES: [Body, string][] = [
  [Body.Sun, "Sun"], [Body.Moon, "Moon"], [Body.Mars, "Mars"],
  [Body.Mercury, "Mercury"], [Body.Jupiter, "Jupiter"], [Body.Venus, "Venus"],
  [Body.Saturn, "Saturn"],
];

export function getVarshaphal(
  natalSunLongitude: number,
  natalLagnaLongitude: number,
  birthDate: Date,
  observer: Observer,
  years?: number[],
): VarshaphalReport {
  const target = norm(natalSunLongitude);
  const birthYear = birthDate.getUTCFullYear();
  const natalLagnaSign = signOf(natalLagnaLongitude);

  const startYear = new Date().getFullYear();
  const list = years ?? [startYear, startYear + 1, startYear + 2, startYear + 3, startYear + 4];

  const charts: AnnualChart[] = list.map((year) => {
    const t = solarReturn(target, year, birthDate);
    const ayan = getAyanamsa(t);

    const ascLon = getUdayaLagna(t, observer, ayan);
    const ascSign = signOf(ascLon);

    const planets: AnnualPlanet[] = BODIES.map(([body, name]) => ({
      planet: name,
      sign: rashiNames[signOf(getPlanetaryPosition(body, t, ayan).longitude)],
    }));
    const rahu = getRahuPosition(t, ayan);
    planets.push({ planet: "Rahu", sign: rashiNames[signOf(rahu.longitude)] });
    planets.push({ planet: "Ketu", sign: rashiNames[signOf(getKetuPosition(rahu).longitude)] });

    // Muntha: natal Lagna advanced one sign per completed year.
    const varsha = year - birthYear;
    const munthaSign = (natalLagnaSign + varsha) % 12;
    const munthaHouse = ((munthaSign - ascSign + 12) % 12) + 1;

    return {
      year,
      varshaPravesh: t.toISOString(),
      ascendant: rashiNames[ascSign],
      muntha: { sign: rashiNames[munthaSign], house: munthaHouse },
      yearLord: RASHI_LORDS[munthaSign],
      planets,
    };
  });

  return { charts };
}
