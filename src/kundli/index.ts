import { Observer, Body, GeoVector, Ecliptic } from "astronomy-engine";
import { getAyanamsa } from "../core/ayanamsa";
import {
  getUdayaLagna,
  getTithi,
  getNakshatra,
  getNakshatraPada,
  calculateVimshottariDasha,
  getPlanetaryPosition,
  getRahuPosition,
  getKetuPosition,
} from "../core/calculations";
import { rashiNames, nakshatraNames, nakshatraLords } from "../core/constants";
import { PlanetaryPosition } from "../core/types";
import { getHouses } from "./houses";
import { getAllVargas } from "./vargas";
import { getSpecialLagnas } from "./special-lagnas";
import { getBhavaChalit } from "./bhava-chalit";
import { getBhavatBhavam } from "./bhavat-bhavam";
import { getAshtakavarga } from "./ashtakavarga";
import { getAvkahada } from "./avkahada";
import { getDoshas } from "./doshas";
import { getTransit } from "./transit";
import { getKp } from "./kp";
import { getJaimini } from "./jaimini";
import { getYoginiDasha } from "../core/yogini-dasha";
import { getVarshaphal } from "./varshaphal";
import { Kundli, KundliConfig, Bhava } from "./types";
import { RASHI_LORDS } from "../matching/constants";
import {
  getChalitChart,
  formatChalitChart,
  getPlanetChalitInfo,
  getPlanetsInHouse,
  getPlanetHouseProgress,
} from "./chalit";

/**
 * Generates a Janam Kundli (Birth Chart) for a given date and location.
 *
 * @param date The Date object of birth (ensure timezone is handled correctly by caller or passed in UTC)
 * @param observer The Observer object (Location)
 * @param config Configuration options (optional)
 */
export function getKundli(
  date: Date,
  observer: Observer,
  config: KundliConfig = {},
): Kundli {
  const ayanamsa = getAyanamsa(date);

  // 1. Calculate Ascendant (Lagna)
  const lagnaLon = getUdayaLagna(date, observer, ayanamsa);
  const degreeDecimal = lagnaLon % 30;
  const degrees = Math.floor(degreeDecimal);
  const minutesDecimal = (degreeDecimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60);
  const lagnaRashiIndex = Math.floor(lagnaLon / 30);
  const lagnaNakshatraIndex = getNakshatra(lagnaLon);
  const lagnaPada = getNakshatraPada(lagnaLon);

  const ascendant = {
    rashi: lagnaRashiIndex + 1,
    rashiName: rashiNames[lagnaRashiIndex],
    rashiLord: RASHI_LORDS[lagnaRashiIndex],
    longitude: lagnaLon,
    degree: degrees,
    minute: minutes,
    second: seconds,
    nakshatra: nakshatraNames[lagnaNakshatraIndex],
    nakshatraLord: nakshatraLords[nakshatraNames[lagnaNakshatraIndex]],
    pada: lagnaPada,
  };

  // 2. Calculate Planets (Sidereal)
  const planets: Record<string, PlanetaryPosition> = {};
  const bodies = [
    Body.Sun,
    Body.Moon,
    Body.Mercury,
    Body.Venus,
    Body.Mars,
    Body.Jupiter,
    Body.Saturn,
    Body.Uranus,
    Body.Neptune,
    Body.Pluto,
  ];
  const bodyNames = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
  ];

  bodies.forEach((body, idx) => {
    const name = bodyNames[idx];
    planets[name] = getPlanetaryPosition(body, date, ayanamsa);
  });

  // Nodes
  const rahuPos = getRahuPosition(date, ayanamsa);
  planets["Rahu"] = rahuPos;
  planets["Ketu"] = getKetuPosition(rahuPos);

  // 3. Calculate Houses
  // Default to 'whole_sign' if not specified
  // Explicitly cast or handle default for compiler safety
  const houseSystem = config.houseSystem || "whole_sign";
  const houses = getHouses(lagnaLon, houseSystem);

  // 4. Map Planets to Houses
  // Iterate through planets and find which house they fall into
  for (const [pName, pData] of Object.entries(planets)) {
    const pLon = pData.longitude;

    // Find the house where startLon <= pLon < endLon
    // Handle wrapping 360 case carefully
    const house = houses.find((h: Bhava) => {
      // Normal case: Start < End (e.g., 30 to 60)
      if (h.startLongitude < h.endLongitude) {
        return pLon >= h.startLongitude && pLon < h.endLongitude;
      }
      // Wrap case: Start > End (e.g., 330 to 0/360 -> Pisces)
      else {
        return pLon >= h.startLongitude || pLon < h.endLongitude;
      }
    });

    if (house) {
      house.planets.push(pName);
    }
  }

  // 5. Calculate Dasha
  const moonLon = planets["Moon"].longitude;
  const dasha = calculateVimshottariDasha(moonLon, date);

  // 6. Calculate Vargas (D1-D60)
  const vargas = getAllVargas(lagnaLon, planets);

  // 6b. Special lagnas, Bhrigu Bindu and upagrahas
  const specialLagnas = getSpecialLagnas(date, observer, planets, lagnaLon);

  // 6c. Bhava Chalit chart (planets by house, asc-centred bhavas)
  const chalit = getBhavaChalit(planets, lagnaLon);

  // 6d. Bhavat Bhavam (house-from-house) analysis
  const bhavatBhavam = getBhavatBhavam(planets, lagnaLon);

  // 7. Ashtakavarga (BAV per planet + SAV)
  const ashtakavarga = getAshtakavarga(planets, lagnaLon);

  // 8. Avkahada Chakra (birth attributes: Varna, Yoni, Gana, Nadi, Paya, …)
  const avkahada = getAvkahada(planets, lagnaLon);

  // 9. Doshas (Mangal/Manglik, Kalsarpa, Sade Sati)
  const doshas = getDoshas(planets, lagnaLon);

  // 10. Gochar (current planetary transits relative to the natal Moon)
  const transit = getTransit(planets["Moon"].longitude);

  // 11. Advanced systems: KP sub-lords, Jaimini, Yogini Dasha
  const kp = getKp(planets, lagnaLon, houses);
  const jaimini = getJaimini(planets, lagnaLon, vargas);
  const yogini = getYoginiDasha(planets["Moon"].longitude, date);

  // 12. Varshaphal (annual / Tajika charts for the coming years)
  const varshaphal = getVarshaphal(planets["Sun"].longitude, lagnaLon, date, observer);


  return {
    birthDetails: {
      date: date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      time: date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      lat: observer.latitude,
      lon: observer.longitude,
      timezone: date.getTimezoneOffset(),
      age: getExactAge(date)
    },
    ascendant,
    planets,
    houses,
    dasha,
    vargas,
    ashtakavarga,
    avkahada,
    doshas,
    transit,
    kp,
    jaimini,
    yogini,
    varshaphal,
    specialLagnas,
    chalit,
    bhavatBhavam,
  };
}


type AgeResult = {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMonths: number
  totalDays: number
  totalHours: number
  totalMinutes: number
  totalSeconds: number
}

export const getExactAge = (birthDate: Date): AgeResult => {
  const now = new Date()

  let years = now.getFullYear() - birthDate.getFullYear()
  let months = now.getMonth() - birthDate.getMonth()
  let days = now.getDate() - birthDate.getDate()
  let hours = now.getHours() - birthDate.getHours()
  let minutes = now.getMinutes() - birthDate.getMinutes()
  let seconds = now.getSeconds() - birthDate.getSeconds()

  if (seconds < 0) {
    seconds += 60
    minutes--
  }

  if (minutes < 0) {
    minutes += 60
    hours--
  }

  if (hours < 0) {
    hours += 24
    days--
  }

  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
    months--
  }

  if (months < 0) {
    months += 12
    years--
  }

  const diffMs = now.getTime() - birthDate.getTime()

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalMonths: years * 12 + months,
    totalDays: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
    totalMinutes: Math.floor(diffMs / (1000 * 60)),
    totalSeconds: Math.floor(diffMs / 1000),
  }
}

// Export Chalit Chart functions
export { getChalitChart, formatChalitChart, getPlanetChalitInfo, getPlanetsInHouse, getPlanetHouseProgress };