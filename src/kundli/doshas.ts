import { Body } from "astronomy-engine";
import { getPlanetaryPosition } from "../core/calculations";
import { getAyanamsa } from "../core/ayanamsa";
import { checkSadeSati, checkDhaiya } from "../core/sadesati";
import { rashiNames } from "../core/constants";

/**
 * Common birth-chart doshas/yogas: Mangal (Manglik), Kalsarpa, and the Saturn
 * cycles (Sade Sati / Dhaiya). These are computed from the natal chart; Sade
 * Sati additionally needs Saturn's current transit position.
 */

export interface MangalDosha {
  present: boolean;
  fromLagna: boolean;
  fromMoon: boolean;
  houseFromLagna: number;
  houseFromMoon: number;
}

export interface KalsarpaDosha {
  present: boolean;
  type?: string;       // e.g. "Anant"
  rahuHouse?: number;  // 1..12 from Lagna
}

export interface SadeSatiInfo {
  active: boolean;
  phase?: number;          // 1, 2 or 3
  phaseName?: string;      // Rising / Peak / Setting
  saturnSign?: string;
  moonSign?: string;
  dhaiya?: { active: boolean; type?: string };
}

export interface DoshaReport {
  mangal: MangalDosha;
  kalsarpa: KalsarpaDosha;
  sadeSati: SadeSatiInfo;
}

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

// Twelve Kalsarpa types, by the house Rahu occupies from the Lagna.
const KALSARPA_TYPES = [
  "Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma",
  "Takshak", "Karkotak", "Shankhachud", "Ghatak", "Vishdhar", "Sheshnag",
];

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);
const houseFrom = (refSign: number, planetSign: number) =>
  ((planetSign - refSign + 12) % 12) + 1;

export function getDoshas(
  planets: Record<string, { longitude: number }>,
  lagnaLongitude: number,
  asOf: Date = new Date(),
): DoshaReport {
  const lagnaSign = signOf(lagnaLongitude);
  const moonSign = signOf(planets["Moon"].longitude);
  const marsSign = signOf(planets["Mars"].longitude);

  // ── Mangal / Manglik ──
  const houseFromLagna = houseFrom(lagnaSign, marsSign);
  const houseFromMoon = houseFrom(moonSign, marsSign);
  const fromLagna = MANGLIK_HOUSES.includes(houseFromLagna);
  const fromMoon = MANGLIK_HOUSES.includes(houseFromMoon);
  const mangal: MangalDosha = {
    present: fromLagna || fromMoon,
    fromLagna,
    fromMoon,
    houseFromLagna,
    houseFromMoon,
  };

  // ── Kalsarpa ── all 7 grahas hemmed on one side of the Rahu–Ketu axis.
  const rahuLon = norm(planets["Rahu"].longitude);
  const seven = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const arcs = seven.map((p) => (norm(planets[p].longitude) - rahuLon + 360) % 360);
  const allForward = arcs.every((d) => d > 0 && d < 180);
  const allBackward = arcs.every((d) => d > 180 && d < 360);
  const present = allForward || allBackward;
  const rahuHouse = houseFrom(lagnaSign, signOf(rahuLon));
  const kalsarpa: KalsarpaDosha = present
    ? { present: true, type: KALSARPA_TYPES[rahuHouse - 1], rahuHouse }
    : { present: false };

  // ── Sade Sati / Dhaiya ── needs Saturn's current transit.
  const transitSaturn = getPlanetaryPosition(Body.Saturn, asOf, getAyanamsa(asOf)).longitude;
  const ss = checkSadeSati(planets["Moon"].longitude, transitSaturn);
  const dh = checkDhaiya(planets["Moon"].longitude, transitSaturn);
  const phaseNames: Record<number, string> = { 1: "Rising", 2: "Peak", 3: "Setting" };
  const sadeSati: SadeSatiInfo = {
    active: ss.status,
    phase: ss.phase,
    phaseName: ss.phase ? phaseNames[ss.phase] : undefined,
    saturnSign: rashiNames[ss.saturnRashi - 1],
    moonSign: rashiNames[ss.moonRashi - 1],
    dhaiya: { active: dh.status, type: dh.type },
  };

  return { mangal, kalsarpa, sadeSati };
}
