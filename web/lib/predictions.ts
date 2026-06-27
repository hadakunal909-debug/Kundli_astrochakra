import type { KundliResponse } from "@/lib/types";
import { RASHI_NAMES, planetDignity } from "@/lib/jyotish-ui";

// All descriptive text in this file is original.

export interface PredictionSection {
  title: string;
  body: string;
}

export interface PlanetPrediction {
  planet: string;
  house: number;
  sign: string;
  dignity: string;
  text: string;
}

// Ascendant (Lagna) personality sketches, by sign index 0 = Aries … 11 = Pisces.
const ASCENDANT: string[] = [
  "With Aries rising you are direct, energetic and quick to act. You like to lead and to start things, and you meet life head-on. Patience and follow-through are the lessons that turn your courage into lasting success.",
  "With Taurus rising you are steady, practical and value security and comfort. You move at your own pace and dislike being rushed. Reliable and determined, you build slowly but surely, though you can be stubborn once your mind is set.",
  "With Gemini rising you are curious, communicative and mentally restless. You pick up ideas quickly and enjoy variety, people and conversation. Focus and consistency are what let your many talents bear fruit.",
  "With Cancer rising you are sensitive, caring and deeply tied to home and family. You feel things strongly and protect those you love. Your moods rise and fall like the tides, so emotional balance is your key to strength.",
  "With Leo rising you are warm, confident and naturally dignified. You enjoy recognition and lead with generosity and pride. When you balance your strong ego with humility, people gladly follow you.",
  "With Virgo rising you are analytical, modest and detail-oriented. You notice what others miss and like things done properly. Guard against over-criticism and worry, and let your practical skill shine.",
  "With Libra rising you are graceful, fair-minded and relationship-focused. You seek balance, beauty and harmony, and dislike conflict. Learning to decide firmly, without endless weighing, is your growth edge.",
  "With Scorpio rising you are intense, private and deeply perceptive. You feel and investigate things to their depths and value loyalty. Channelled well, your willpower is formidable; unchecked, it can turn to suspicion.",
  "With Sagittarius rising you are optimistic, philosophical and freedom-loving. You aim high, love travel and learning, and speak your truth plainly. Commitment and detail are what ground your big vision.",
  "With Capricorn rising you are disciplined, ambitious and responsible. You take the long view and earn your place through patience and hard work. Allow warmth and rest in, so duty does not become rigidity.",
  "With Aquarius rising you are original, humane and independent-minded. You think ahead of your time and care about the bigger picture. Your strength is vision; your lesson is staying emotionally connected to individuals.",
  "With Pisces rising you are gentle, imaginative and compassionate. You sense the unseen and feel others' emotions as your own. Strong boundaries and a practical anchor keep your dreamy nature productive.",
];

// Moon-sign emotional nature, by sign index.
const MOON: string[] = [
  "Your Moon in Aries gives a quick, impulsive emotional nature. You react fast, need independence, and recover from setbacks rapidly.",
  "Your Moon in Taurus gives a calm, steady emotional nature. You crave security and comfort and are soothed by routine and the senses.",
  "Your Moon in Gemini gives a restless, curious mind. You process feelings through words and need mental stimulation and variety.",
  "Your Moon in Cancer is at home — emotional, nurturing and intuitive. Family and a sense of belonging are central to your wellbeing.",
  "Your Moon in Leo gives a warm, proud and expressive heart. You need appreciation and give affection generously.",
  "Your Moon in Virgo gives a thoughtful, careful emotional nature. You show love through service and can worry about small things.",
  "Your Moon in Libra needs harmony, companionship and beauty. You feel most settled in balanced, peaceful relationships.",
  "Your Moon in Scorpio gives deep, intense feelings. You love and react powerfully and value emotional honesty and loyalty.",
  "Your Moon in Sagittarius gives an optimistic, freedom-seeking heart. You feel best when learning, exploring or believing in something larger.",
  "Your Moon in Capricorn gives a reserved, self-reliant emotional nature. You take feelings seriously and find security in achievement.",
  "Your Moon in Aquarius gives a calm, detached and humane emotional nature. You need freedom and connect through shared ideals.",
  "Your Moon in Pisces gives a tender, dreamy and compassionate heart. You absorb the moods around you and need gentle, creative outlets.",
];

const PLANET_SIGNIF: Record<string, string> = {
  Sun: "your soul, vitality, confidence and sense of authority",
  Moon: "your mind, emotions, instincts and need for comfort",
  Mars: "your drive, courage, energy and capacity for action",
  Mercury: "your intellect, speech, learning and skill with detail",
  Jupiter: "your wisdom, optimism, ethics and urge to grow",
  Venus: "your sense of love, beauty, relationships and the arts",
  Saturn: "your discipline, patience, responsibility and long-term effort",
  Rahu: "your worldly ambition, obsessions and unconventional desires",
  Ketu: "your detachment, intuition and spiritual leanings",
};

const HOUSE_THEME: string[] = [
  "your self, personality, health and overall direction in life",
  "wealth, family, speech and the resources you gather",
  "courage, siblings, communication and self-effort",
  "home, mother, emotional security and property",
  "creativity, children, romance and education",
  "health, daily work, competition and obstacles",
  "marriage, partnerships and your dealings with others",
  "transformation, shared resources, research and sudden change",
  "fortune, beliefs, higher learning, mentors and long journeys",
  "career, status, reputation and your public role",
  "gains, income, friendships and aspirations",
  "expenses, letting go, solitude, foreign lands and spirituality",
];

const DIGNITY_NOTE: Record<string, string> = {
  Exalted: "Placed in its sign of exaltation, it gives strong and favourable results here.",
  Own: "In its own sign, it sits comfortably and supports this area well.",
  Friend: "In a friendly sign, it generally works in your favour here.",
  Neutral: "In a neutral sign, its results here are mixed and depend on supporting factors.",
  Enemy: "In an unfriendly sign, results in this area may need conscious effort.",
  Debilitated: "Placed in its sign of debilitation, results here come through effort and important life lessons.",
};

const AV_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getPredictions(data: KundliResponse): {
  ascendant: PredictionSection;
  moon: PredictionSection;
  planets: PlanetPrediction[];
} {
  const k = data.kundli;
  const ascIdx = k.ascendant.rashi - 1;
  const moonIdx = (k.planets["Moon"]?.rashi ?? 1) - 1;

  // Map each planet to its house from the ascendant.
  const planets: PlanetPrediction[] = [];
  for (const name of AV_PLANETS) {
    const p = k.planets[name];
    if (!p) continue;
    const signIdx = Math.floor((((p.longitude % 360) + 360) % 360) / 30);
    const house = ((signIdx - ascIdx + 12) % 12) + 1;
    const dignity = planetDignity(name, p.longitude);
    const note = DIGNITY_NOTE[dignity] ? " " + DIGNITY_NOTE[dignity] : "";
    const text =
      `${name} in your ${ordinal(house)} house places ${PLANET_SIGNIF[name]} ` +
      `in the area of ${HOUSE_THEME[house - 1]}.${note}`;
    planets.push({ planet: name, house, sign: RASHI_NAMES[signIdx], dignity, text });
  }
  planets.sort((a, b) => a.house - b.house);

  return {
    ascendant: { title: `${RASHI_NAMES[ascIdx]} Ascendant`, body: ASCENDANT[ascIdx] },
    moon: { title: `${RASHI_NAMES[moonIdx]} Moon`, body: MOON[moonIdx] },
    planets,
  };
}
