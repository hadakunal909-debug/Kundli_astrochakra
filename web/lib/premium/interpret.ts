// Expanded interpretation vocabulary + helpers for the personalized report.
// All prose here is original. The goal is to combine several real chart factors
// (sign, nakshatra, dignity, retrogression, combustion, house occupants) so two
// charts read differently even when they share an ascendant.

export const SIGN_TRAITS: string[] = [
  "bold, direct and pioneering, happiest leading from the front",
  "steady, patient and grounded, valuing security and life's comforts",
  "curious, quick-witted and communicative, thriving on variety and ideas",
  "caring, intuitive and protective, deeply tied to home and feeling",
  "confident, warm and generous, with a natural flair for the spotlight",
  "precise, practical and analytical, with a gift for improving things",
  "fair, charming and relationship-minded, always seeking balance",
  "intense, private and determined, with formidable depth and willpower",
  "optimistic, philosophical and freedom-loving, after the bigger picture",
  "disciplined, ambitious and responsible, built for the long climb",
  "original, humane and independent, drawn to ideas ahead of their time",
  "imaginative, compassionate and sensitive, with a rich inner world",
];

// Short personality colour for each of the 27 nakshatras (Moon's star).
export const NAKSHATRA_TRAIT: Record<string, string> = {
  Ashwini: "quick to act, pioneering and eager to help",
  Bharani: "intense, disciplined and able to see things through",
  Krittika: "sharp, driven and unwilling to tolerate pretense",
  Rohini: "magnetic, creative and fond of beauty and comfort",
  Mrigashira: "curious, restless and forever searching",
  Ardra: "probing, transformative and emotionally deep",
  Punarvasu: "optimistic, resilient and able to begin again",
  Pushya: "nurturing, dependable and deeply caring",
  Ashlesha: "perceptive, strategic and quietly persuasive",
  Magha: "proud, dignified and respectful of tradition",
  "Purva Phalguni": "warm, playful and fond of life's pleasures",
  "Uttara Phalguni": "generous, reliable and a steady friend",
  Hasta: "skilful, clever and good with detail",
  Chitra: "artistic, charismatic and drawn to design",
  Swati: "independent, adaptable and freedom-loving",
  Vishakha: "ambitious, goal-focused and determined to arrive",
  Anuradha: "devoted, cooperative and loyal in bonds",
  Jyeshtha: "protective, sharp and a natural authority",
  Mula: "investigative, root-seeking and unafraid of upheaval",
  "Purva Ashadha": "persuasive, spirited and hard to discourage",
  "Uttara Ashadha": "principled, persistent and a winner by endurance",
  Shravana: "attentive, wise and a great listener",
  Dhanishta: "rhythmic, prosperous and group-minded",
  Shatabhisha: "independent, inventive and quietly healing",
  "Purva Bhadrapada": "idealistic, intense and given to big visions",
  "Uttara Bhadrapada": "calm, deep, patient and compassionate",
  Revati: "gentle, imaginative, nurturing and well-liked",
};

export const HOUSE_THEME = [
  "self & vitality", "wealth & speech", "courage & initiative", "home & heart",
  "creativity & children", "work & health", "partnership", "transformation",
  "fortune & dharma", "career & status", "gains & network", "release & solitude",
];

export const PLANET_QUALITY: Record<string, string> = {
  Sun: "drive for recognition and self-expression",
  Moon: "emotional sensitivity and a need for connection",
  Mars: "energy, courage and assertiveness",
  Mercury: "intellect, communication and skill",
  Jupiter: "wisdom, optimism and a wish to expand",
  Venus: "love of beauty, harmony and pleasure",
  Saturn: "discipline, responsibility and endurance",
  Rahu: "hunger for growth and the unconventional",
  Ketu: "detachment, intuition and a pull to let go",
};

export const ord = (n: number) =>
  n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

/** First name only, for a personal touch (falls back to a neutral address). */
export function firstName(name: string): string {
  const n = (name ?? "").trim().split(/\s+/)[0];
  return n || "Your";
}

/** A short phrase for a dignity state. */
export function dignityPhrase(state: string): string {
  switch (state) {
    case "Exalted": return "exceptionally well placed";
    case "Moolatrikona": return "powerfully placed in moolatrikona";
    case "Own": return "strong in its own sign";
    case "Friend": return "comfortably placed";
    case "Neutral": return "neutrally placed";
    case "Enemy": return "under some strain";
    case "Debilitated": return "weakened and needing conscious support";
    default: return "placed";
  }
}

export interface CondInfo {
  state?: string;
  retro?: boolean;
  combust?: boolean;
}

/** Combine dignity + retrogression + combustion into one readable condition clause. */
export function planetCondition(planet: string, info: CondInfo): string {
  const bits = [dignityPhrase(info.state ?? "")];
  if (info.combust) bits.push("though combust (close to the Sun)");
  if (info.retro && planet !== "Sun" && planet !== "Moon") bits.push("and retrograde, turning its force inward");
  return bits.join(", ");
}

/** Templated planet-in-house reading, coloured by the planet's condition. */
export function planetInHouse(planet: string, house: number, info: CondInfo): string {
  return `${planet} brings ${PLANET_QUALITY[planet] ?? "its influence"} to your ${ord(house)} house of ${HOUSE_THEME[house - 1]}, ${planetCondition(planet, info)}`;
}

/** Deterministic pick from a list, seeded by chart numbers, so phrasing varies by chart. */
export function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

/** List grahas in a house as readable text, or a fallback. */
export function tenants(occ: string[]): string {
  if (!occ.length) return "";
  if (occ.length === 1) return occ[0];
  return occ.slice(0, -1).join(", ") + " and " + occ[occ.length - 1];
}
