// Vedic / Pythagorean numerology derived from the date of birth and full name.
// All descriptive text here is original.

export interface NumberInsight {
  number: number;
  lord: string;
  text: string;
}

export interface NumerologyResult {
  radical: NumberInsight;   // Mulank — from the day of birth
  destiny: NumberInsight;   // Bhagyank — from the full date of birth
  nameNumber: NumberInsight; // Namank — from the full name
  luckyNumbers: number[];
  luckyDays: string[];
}

const LORD: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

const LUCKY_DAYS: Record<number, string[]> = {
  1: ["Sunday"], 2: ["Monday"], 3: ["Thursday"], 4: ["Saturday"], 5: ["Wednesday"],
  6: ["Friday"], 7: ["Monday"], 8: ["Saturday"], 9: ["Tuesday"],
};

// Original character notes for each root number (1–9).
const NUMBER_TEXT: Record<number, string> = {
  1: "Ruled by the Sun, you are independent, ambitious and a natural leader. You like to set your own direction and dislike being told what to do. Self-belief and originality are your strengths; impatience and ego are the traits to watch.",
  2: "Ruled by the Moon, you are gentle, intuitive and cooperative. You read people well and value harmony, working better in partnership than in isolation. Sensitivity is your gift, but you can be moody and over-dependent on others' approval.",
  3: "Ruled by Jupiter, you are optimistic, expressive and drawn to knowledge and growth. People respect your wisdom and warmth. You do well in teaching, advising and creative work, though you should guard against over-commitment and scattering your energy.",
  4: "Ruled by Rahu, you are practical, hard-working and unconventional. You see the world differently and can build things others cannot, often after early struggles. Stability and patience reward you; restlessness and stubbornness hold you back.",
  5: "Ruled by Mercury, you are quick, communicative and versatile, with a wide circle of friends and a flair for business. You adapt fast and dislike monotony. Channel your restless energy and avoid acting in haste.",
  6: "Ruled by Venus, you are charming, artistic and devoted to comfort, beauty and relationships. You attract people easily and care deeply for family. Balance your love of luxury with discipline, and avoid over-indulgence.",
  7: "Ruled by Ketu, you are reflective, analytical and spiritually inclined. You seek meaning beneath the surface and value solitude and study. Your intuition is strong; just guard against detachment and over-thinking.",
  8: "Ruled by Saturn, you are disciplined, resilient and built for the long game. Success may come slowly but lasts, earned through persistence and responsibility. Avoid pessimism and learn to delegate.",
  9: "Ruled by Mars, you are energetic, courageous and determined. You fight for what you believe in and finish what you start. Your drive inspires others, but temper impulsiveness and a quick temper.",
};

/** Reduce a number to a single digit 1–9. */
function reduce(n: number): number {
  let x = Math.abs(n);
  while (x > 9) {
    x = String(x).split("").reduce((s, d) => s + Number(d), 0);
  }
  return x === 0 ? 9 : x;
}

// Chaldean letter values (the system used by most Vedic numerology reports).
const CHALDEAN: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};

function insight(num: number): NumberInsight {
  return { number: num, lord: LORD[num], text: NUMBER_TEXT[num] };
}

/**
 * @param localDate "YYYY-MM-DD"
 * @param name full birth name
 */
export function getNumerology(localDate: string, name: string): NumerologyResult {
  const [y, m, d] = localDate.split("-").map(Number);
  const radical = reduce(d);
  const destiny = reduce((y || 0) + (m || 0) + (d || 0));

  let nameSum = 0;
  for (const ch of (name || "").toLowerCase()) {
    if (CHALDEAN[ch]) nameSum += CHALDEAN[ch];
  }
  const nameNumber = nameSum ? reduce(nameSum) : radical;

  const lucky = Array.from(new Set([radical, destiny])).sort((a, b) => a - b);
  const days = Array.from(new Set([...LUCKY_DAYS[radical], ...LUCKY_DAYS[destiny]]));

  return {
    radical: insight(radical),
    destiny: insight(destiny),
    nameNumber: insight(nameNumber),
    luckyNumbers: lucky,
    luckyDays: days,
  };
}
