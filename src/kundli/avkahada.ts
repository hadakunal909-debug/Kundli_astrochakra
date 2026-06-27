import { rashiNames, nakshatraNames, nakshatraLords } from "../core/constants";
import {
  VARNA_ORDER, RASHI_VARNA,
  VASHYA_TYPES, RASHI_VASHYA,
  NAKSHATRA_YONI, YONI_NAMES,
  NAKSHATRA_GANA, GANA_NAMES,
  NAKSHATRA_NADI, NADI_NAMES,
  RASHI_LORDS,
} from "../matching/constants";

/**
 * Avkahada Chakra — the cluster of birth attributes Vedic reports show alongside
 * the basic details (Varna, Vashya, Yoni, Gana, Nadi, Paya, Tatva, name syllable,
 * etc.). Almost everything is a lookup keyed by the Moon's sign or nakshatra, so
 * we reuse the tables already maintained for Ashtakoota matching.
 */

export interface FavourablePoints {
  luckyNumbers: number[];
  luckyDays: string[];
  luckyColors: string[];
  gemstone: string;
  metal: string;
  direction: string;
  deity: string;
}

export interface AvkahadaResult {
  varna: string;
  vashya: string;
  yoni: string;
  gana: string;
  nadi: string;
  paya: string;            // Gold / Silver / Copper / Iron
  tatva: string;           // element of the Moon sign
  moonSign: string;
  moonSignLord: string;
  sunSignSidereal: string;
  nakshatra: string;
  nakshatraPada: number;
  nakshatraLord: string;   // star lord (Vimshottari)
  nameSyllable: string;    // suggested first syllable (Naam akshar)
  lagna: string;
  lagnaLord: string;
  favourable: FavourablePoints;
}

// Five great elements (Tatva) per sign (0 = Aries … 11 = Pisces).
const RASHI_TATVA = [
  "Fire", "Earth", "Air", "Water",
  "Fire", "Earth", "Air", "Water",
  "Fire", "Earth", "Air", "Water",
];

// Naam akshar — the customary first syllable for each of the 4 padas of a
// nakshatra (27 × 4). Standard transliteration.
const NAME_SYLLABLES: string[][] = [
  ["Chu", "Che", "Cho", "La"],      // Ashwini
  ["Lee", "Lu", "Le", "Lo"],        // Bharani
  ["A", "Ee", "U", "Ea"],           // Krittika
  ["O", "Va", "Vi", "Vu"],          // Rohini
  ["Ve", "Vo", "Ka", "Ki"],         // Mrigashira
  ["Ku", "Gha", "Ang", "Chha"],     // Ardra
  ["Ke", "Ko", "Ha", "Hi"],         // Punarvasu
  ["Hu", "He", "Ho", "Da"],         // Pushya
  ["Dee", "Du", "De", "Do"],        // Ashlesha
  ["Ma", "Mi", "Mu", "Me"],         // Magha
  ["Mo", "Ta", "Ti", "Tu"],         // Purva Phalguni
  ["Te", "To", "Pa", "Pi"],         // Uttara Phalguni
  ["Pu", "Sha", "Na", "Tha"],       // Hasta
  ["Pe", "Po", "Ra", "Ri"],         // Chitra
  ["Ru", "Re", "Ro", "Ta"],         // Swati
  ["Ti", "Tu", "Te", "To"],         // Vishakha
  ["Na", "Ni", "Nu", "Ne"],         // Anuradha
  ["No", "Ya", "Yi", "Yu"],         // Jyeshtha
  ["Ye", "Yo", "Bha", "Bhi"],       // Mula
  ["Bhu", "Dha", "Pha", "Dha"],     // Purva Ashadha
  ["Bhe", "Bho", "Ja", "Ji"],       // Uttara Ashadha
  ["Ju", "Je", "Jo", "Gha"],        // Shravana
  ["Ga", "Gi", "Gu", "Ge"],         // Dhanishta
  ["Go", "Sa", "Si", "Su"],         // Shatabhisha
  ["Se", "So", "Da", "Di"],         // Purva Bhadrapada
  ["Du", "Tha", "Jha", "Tra"],      // Uttara Bhadrapada
  ["De", "Do", "Cha", "Chi"],       // Revati
];

// Per-planet auspicious associations (used for favourable points).
const PLANET_ASSOC: Record<string, FavourablePoints> = {
  Sun: { luckyNumbers: [1], luckyDays: ["Sunday"], luckyColors: ["Red", "Orange"], gemstone: "Ruby", metal: "Gold / Copper", direction: "East", deity: "Surya / Shiva" },
  Moon: { luckyNumbers: [2], luckyDays: ["Monday"], luckyColors: ["White", "Cream"], gemstone: "Pearl", metal: "Silver", direction: "North-West", deity: "Parvati / Gauri" },
  Mars: { luckyNumbers: [9], luckyDays: ["Tuesday"], luckyColors: ["Red", "Scarlet"], gemstone: "Red Coral", metal: "Copper", direction: "South", deity: "Hanuman / Kartikeya" },
  Mercury: { luckyNumbers: [5], luckyDays: ["Wednesday"], luckyColors: ["Green"], gemstone: "Emerald", metal: "Bronze", direction: "North", deity: "Vishnu / Ganesha" },
  Jupiter: { luckyNumbers: [3], luckyDays: ["Thursday"], luckyColors: ["Yellow", "Gold"], gemstone: "Yellow Sapphire", metal: "Gold", direction: "North-East", deity: "Brihaspati / Vishnu" },
  Venus: { luckyNumbers: [6], luckyDays: ["Friday"], luckyColors: ["White", "Pink"], gemstone: "Diamond", metal: "Silver / Platinum", direction: "South-East", deity: "Lakshmi" },
  Saturn: { luckyNumbers: [8], luckyDays: ["Saturday"], luckyColors: ["Blue", "Black"], gemstone: "Blue Sapphire", metal: "Iron", direction: "West", deity: "Shani / Hanuman" },
};

const NAK_SPAN = 360 / 27; // 13°20'

function norm360(lon: number): number {
  return ((lon % 360) + 360) % 360;
}
function signOf(lon: number): number {
  return Math.floor(norm360(lon) / 30);
}
function nakIndexOf(lon: number): number {
  return Math.floor(norm360(lon) / NAK_SPAN);
}
function padaOf(lon: number): number {
  const within = norm360(lon) % NAK_SPAN;
  return Math.floor(within / (NAK_SPAN / 4)) + 1; // 1..4
}

/**
 * @param planets map of planet name -> { longitude } (sidereal). Needs Sun & Moon.
 * @param lagnaLongitude sidereal longitude of the ascendant.
 */
export function getAvkahada(
  planets: Record<string, { longitude: number }>,
  lagnaLongitude: number,
): AvkahadaResult {
  const moonLon = planets["Moon"].longitude;
  const sunLon = planets["Sun"].longitude;

  const moonSignIdx = signOf(moonLon);
  const moonNakIdx = nakIndexOf(moonLon);
  const pada = padaOf(moonLon);
  const lagnaSignIdx = signOf(lagnaLongitude);

  // Vashya: Sagittarius and Capricorn split at mid-sign into two types.
  const moonDeg = norm360(moonLon) % 30;
  let vashyaIdx = RASHI_VASHYA[moonSignIdx];
  if (moonSignIdx === 8) vashyaIdx = moonDeg < 15 ? 1 : 0;      // Sag: Manav / Chatushpad
  else if (moonSignIdx === 9) vashyaIdx = moonDeg < 15 ? 0 : 2; // Cap: Chatushpad / Jalchar

  // Paya by nakshatra number (1..27) mod 4: 1 Gold, 2 Silver, 3 Copper, 0 Iron.
  const payaNames = ["Iron", "Gold", "Silver", "Copper"]; // index = (nakNum % 4)
  const paya = payaNames[(moonNakIdx + 1) % 4];

  const lagnaLord = RASHI_LORDS[lagnaSignIdx];
  const favourable =
    PLANET_ASSOC[lagnaLord] ?? PLANET_ASSOC[RASHI_LORDS[moonSignIdx]] ?? PLANET_ASSOC.Sun;

  return {
    varna: VARNA_ORDER[RASHI_VARNA[moonSignIdx]],
    vashya: VASHYA_TYPES[vashyaIdx],
    yoni: YONI_NAMES[NAKSHATRA_YONI[moonNakIdx]],
    gana: GANA_NAMES[NAKSHATRA_GANA[moonNakIdx]],
    nadi: NADI_NAMES[NAKSHATRA_NADI[moonNakIdx]],
    paya,
    tatva: RASHI_TATVA[moonSignIdx],
    moonSign: rashiNames[moonSignIdx],
    moonSignLord: RASHI_LORDS[moonSignIdx],
    sunSignSidereal: rashiNames[signOf(sunLon)],
    nakshatra: nakshatraNames[moonNakIdx],
    nakshatraPada: pada,
    nakshatraLord: nakshatraLords[nakshatraNames[moonNakIdx]],
    nameSyllable: NAME_SYLLABLES[moonNakIdx][pada - 1],
    lagna: rashiNames[lagnaSignIdx],
    lagnaLord,
    favourable,
  };
}
