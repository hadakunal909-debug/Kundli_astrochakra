import type { KundliResponse } from "@/lib/types";
import { lordOfRashi } from "@/lib/jyotish-ui";

// Planetary remedy associations + original guidance text.

interface PlanetRemedy {
  gem: string;
  metal: string;
  finger: string;
  day: string;
  rudraksha: string;
  mantra: string;
  deity: string;
  daan: string;
}

const REMEDY: Record<string, PlanetRemedy> = {
  Sun: { gem: "Ruby", metal: "Gold / Copper", finger: "Ring", day: "Sunday", rudraksha: "1 Mukhi", mantra: "Om Suryaya Namah", deity: "Surya / Shiva", daan: "wheat, jaggery, copper" },
  Moon: { gem: "Pearl", metal: "Silver", finger: "Little", day: "Monday", rudraksha: "2 Mukhi", mantra: "Om Chandraya Namah", deity: "Parvati / Gauri", daan: "rice, milk, silver" },
  Mars: { gem: "Red Coral", metal: "Copper / Gold", finger: "Ring", day: "Tuesday", rudraksha: "3 Mukhi", mantra: "Om Mangalaya Namah", deity: "Hanuman / Kartikeya", daan: "red lentils, jaggery" },
  Mercury: { gem: "Emerald", metal: "Gold / Bronze", finger: "Little", day: "Wednesday", rudraksha: "4 Mukhi", mantra: "Om Budhaya Namah", deity: "Vishnu / Ganesha", daan: "green gram, green cloth" },
  Jupiter: { gem: "Yellow Sapphire", metal: "Gold", finger: "Index", day: "Thursday", rudraksha: "5 Mukhi", mantra: "Om Gurave Namah", deity: "Vishnu / Brihaspati", daan: "turmeric, gram dal, gold" },
  Venus: { gem: "Diamond / White Sapphire", metal: "Silver / Platinum", finger: "Ring", day: "Friday", rudraksha: "6 Mukhi", mantra: "Om Shukraya Namah", deity: "Lakshmi", daan: "white cloth, sugar, curd" },
  Saturn: { gem: "Blue Sapphire", metal: "Iron / Silver", finger: "Middle", day: "Saturday", rudraksha: "7 Mukhi", mantra: "Om Shanaischaraya Namah", deity: "Shani / Hanuman", daan: "black sesame, mustard oil, iron" },
  Rahu: { gem: "Hessonite (Gomed)", metal: "Silver / Lead", finger: "Middle", day: "Saturday", rudraksha: "8 Mukhi", mantra: "Om Rahave Namah", deity: "Durga", daan: "blanket, sesame, blue cloth" },
  Ketu: { gem: "Cat's Eye (Lehsunia)", metal: "Silver", finger: "Middle", day: "Tuesday", rudraksha: "9 Mukhi", mantra: "Om Ketave Namah", deity: "Ganesha", daan: "multi-coloured cloth, sesame" },
};

const norm = (lon: number) => ((lon % 360) + 360) % 360;
const degInSign = (lon: number) => norm(lon) % 30;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);

export interface RemediesResult {
  lifeGem: { planet: string } & PlanetRemedy;
  atmakaraka: string;
  ishtDevata: { deity: string; via: string };
  rudrakshas: { planet: string; mukhi: string }[];
  mantras: { planet: string; mantra: string }[];
  daan: { planet: string; items: string }[];
}

export function getRemedies(data: KundliResponse): RemediesResult {
  const k = data.kundli;

  // Life gemstone — based on the Ascendant lord.
  const lagnaLord = lordOfRashi(k.ascendant.rashi);
  const lifeRem = REMEDY[lagnaLord] ?? REMEDY.Sun;

  // Atmakaraka — the planet with the highest degree within its sign (7 chara karakas).
  const CHARA = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  let atmakaraka = "Sun";
  let maxDeg = -1;
  for (const name of CHARA) {
    const p = k.planets[name];
    if (!p) continue;
    const d = degInSign(p.longitude);
    if (d > maxDeg) {
      maxDeg = d;
      atmakaraka = name;
    }
  }

  // Karakamsa = sign of the Atmakaraka in the Navamsa (D9); Isht Devata is read
  // from the 12th sign from Karakamsa — the planet(s) there, else that sign's lord.
  let ishtPlanet = atmakaraka;
  let via = "Ascendant lord";
  const d9 = k.vargas?.d9;
  if (d9) {
    const karakamsa1 = d9.planets[atmakaraka]?.rashi ?? d9.ascendant.rashi; // 1..12
    const twelfth1 = ((karakamsa1 - 1 + 11) % 12) + 1;
    const inTwelfth = Object.entries(d9.planets)
      .filter(([, pos]) => pos.rashi === twelfth1)
      .map(([n]) => n)
      .filter((n) => REMEDY[n]);
    if (inTwelfth.length) {
      ishtPlanet = inTwelfth[0];
      via = `planet in the 12th from Karakamsa (Navamsa)`;
    } else {
      ishtPlanet = lordOfRashi(twelfth1);
      via = `lord of the 12th from Karakamsa (Navamsa)`;
    }
  }
  const ishtDevata = { deity: (REMEDY[ishtPlanet] ?? REMEDY.Sun).deity, via };

  // For remedy lists, highlight the malefic/weak planets worth strengthening:
  // the Ascendant lord plus the lords of the Moon and Sun signs.
  const focus = Array.from(
    new Set([lagnaLord, lordOfRashi(signOf(k.planets["Moon"].longitude) + 1), lordOfRashi(signOf(k.planets["Sun"].longitude) + 1)]),
  ).filter((p) => REMEDY[p]);

  return {
    lifeGem: { planet: lagnaLord, ...lifeRem },
    atmakaraka,
    ishtDevata,
    rudrakshas: focus.map((p) => ({ planet: p, mukhi: REMEDY[p].rudraksha })),
    mantras: focus.map((p) => ({ planet: p, mantra: REMEDY[p].mantra })),
    daan: focus.map((p) => ({ planet: p, items: REMEDY[p].daan })),
  };
}
