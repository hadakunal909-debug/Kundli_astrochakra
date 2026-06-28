import type { KundliResponse } from "@/lib/types";
import { lordOfRashi, RASHI_NAMES } from "@/lib/jyotish-ui";
import { getNumerology } from "@/lib/numerology";
import { getPremiumScores, type PremiumScores } from "./scores";
import { amsaLabel } from "./varga";
import type { DetectedYoga, Factors } from "./factors";

// All prose in this file is original, generated from the chart's factors/scores.

const ELEMENTS = ["Fire", "Earth", "Air", "Water"];
const ELEMENT_CAREERS: Record<string, string[]> = {
  Fire: ["leadership", "defence & sport", "energy", "entrepreneurship", "government"],
  Earth: ["finance", "real estate", "engineering", "administration", "operations"],
  Air: ["communication & media", "technology", "consulting", "design", "networks"],
  Water: ["healthcare & healing", "hospitality", "research", "creative arts", "marine/chemicals"],
};
const SIGN_TRAIT = [
  "bold and pioneering", "steady and grounded", "curious and communicative", "caring and intuitive",
  "confident and warm", "precise and practical", "fair and relationship-minded", "intense and determined",
  "optimistic and freedom-loving", "disciplined and ambitious", "original and humane", "imaginative and compassionate",
];
const HOUSE_THEME = [
  "self & vitality", "wealth & speech", "courage & initiative", "home & heart", "creativity & children",
  "work & health", "partnership", "transformation", "fortune & dharma", "career & status", "gains & network", "release & solitude",
];
const PURPOSE: Record<string, string> = {
  Sun: "authority, vitality and self-expression",
  Moon: "emotional balance, instinct and connection with people",
  Mars: "energy, courage and decisive action",
  Mercury: "intellect, communication and commerce",
  Jupiter: "wisdom, growth, ethics and abundance",
  Venus: "love, beauty, relationships and refinement",
  Saturn: "discipline, structure and long-term mastery",
  Rahu: "ambition, innovation and worldly expansion",
  Ketu: "intuition, detachment and depth",
};
const ACTIVATION: Record<string, string> = {
  Sun: "rise early, honour your father and elders, lead with integrity (Sundays)",
  Moon: "protect your sleep and routines, stay close to your mother and water (Mondays)",
  Mars: "train your body daily and channel anger into disciplined effort (Tuesdays)",
  Mercury: "read, write and learn every day, and always keep your word (Wednesdays)",
  Jupiter: "study something meaningful and mentor others generously (Thursdays)",
  Venus: "create beauty, nurture your relationships, keep clean surroundings (Fridays)",
  Saturn: "serve steadily, keep every commitment, help workers and the elderly (Saturdays)",
  Rahu: "avoid shortcuts and intoxicants; aim your ambition at one clear goal",
  Ketu: "meditate, simplify, and pursue depth over breadth",
};
const ALL = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

const ord = (n: number) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
const aAn = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
const elementOf = (s0: number) => ELEMENTS[s0 % 4];
const utilLabel = (u: number) => (u >= 70 ? "Well placed" : u >= 50 ? "Workable" : "Needs support");

export interface PlanetUse {
  planet: string; purpose: string; strength: string; weakness: string; activation: string; util: number;
}
export interface ScorecardRow { planet: string; strengthLabel: string; util: number; tip: string; }

export interface PremiumContent {
  s: PremiumScores;
  lifeTheme: string;
  career: { text: string; industries: string[] };
  money: string;
  relationships: string;
  personality: string;
  planetUse: PlanetUse[];
  yogakaraka: string;
  bhagya: string;
  numerology: ReturnType<typeof getNumerology>;
  strengths: string[];
  weaknesses: string[];
  yogas: DetectedYoga[];
  mahadasha: { title: string; text: string }[];
  transits: { planet: string; sign: string; house: number; effect: string }[];
  lucky: { numbers: string; days: string; colors: string; gem: string; direction: string; deity: string };
  health: string;
  actionPlan: { daily: string[]; weekly: string[]; monthly: string[] };
  activation30: { week: string; planet: string; focus: string }[];
  scorecard: ScorecardRow[];
  roadmap: { purpose: string; career: string; wealth: string; opportunities: string; cautions: string };
}

const GOOD_FROM_MOON: Record<string, number[]> = {
  Saturn: [3, 6, 11], Jupiter: [2, 5, 7, 9, 11], Rahu: [3, 6, 10, 11], Ketu: [3, 6, 10, 11],
};

export function getPremiumContent(data: KundliResponse): PremiumContent {
  const k = data.kundli;
  const s = getPremiumScores(data);
  const f = s.factors;
  const ps = (p: string) => f.planetStrength[p] ?? 45;
  const lagnaLord = lordOfRashi(f.ascSign0 + 1);
  // Echo each life-area score's dominant reason into the written prose, so the
  // narrative matches the dashboard rather than reading generically.
  const noteFor = (key: string) => s.scores.find((x) => x.key === key)?.note ?? "";

  // Jaimini references — Upapada Lagna (marriage/spouse) & Karakamsa (innate nature/profession).
  const ulSign0 = RASHI_NAMES.indexOf(k.jaimini?.upapadaLagna ?? "");
  const kkSign0 = RASHI_NAMES.indexOf(k.jaimini?.karakamsa ?? "");
  const NAT_BEN = ["Jupiter", "Venus", "Mercury", "Moon"];
  const karakamsaNote = kkSign0 >= 0
    ? `Your Karakamsa — the soul-planet's navamsa sign — is ${RASHI_NAMES[kkSign0]}, colouring your innate working nature as ${SIGN_TRAIT[kkSign0]} and drawing you toward ${ELEMENT_CAREERS[elementOf(kkSign0)].slice(0, 3).join(", ")}.`
    : "";
  let upapadaNote = "";
  if (ulSign0 >= 0) {
    const ul2 = (ulSign0 + 1) % 12;
    const occ2 = ALL.filter((p) => f.planetSign0[p] === ul2);
    const hasMal = occ2.some((p) => !NAT_BEN.includes(p));
    const hasBen = occ2.some((p) => NAT_BEN.includes(p));
    const tone = hasBen && !hasMal
      ? "Benefic support to the house just after it points to a lasting, harmonious bond."
      : hasMal && !hasBen
      ? "A malefic just after it asks for patience and care to keep the marriage steady."
      : "The bond tends to develop steadily as both partners mature.";
    upapadaNote = `Your Upapada Lagna (the marriage arudha) falls in ${RASHI_NAMES[ulSign0]}, suggesting a spouse who is ${SIGN_TRAIT[ulSign0]}. ${tone}`;
  }

  // 2. Life theme
  const lifeTheme =
    `Your soul's chief signification is ${f.atmakaraka} — your deepest growth revolves around ${PURPOSE[f.atmakaraka]}. ` +
    `With ${RASHI_NAMES[f.ascSign0]} rising you are ${SIGN_TRAIT[f.ascSign0]}, and your fortune flows through ${HOUSE_THEME[8]} ruled by ${f.bhagyaLord}. ` +
    `The recurring theme of this life is learning to express ${PURPOSE[f.atmakaraka]} with maturity.`;

  // 3. Career
  const tenthSign = f.signOfHouse(10);
  const tenthLord = lordOfRashi(tenthSign + 1);
  const lordHouse = f.planetHouse[tenthLord];
  const industries = ELEMENT_CAREERS[elementOf(tenthSign)];
  const careerText =
    `Your career axis is shaped by ${tenthLord}, lord of the 10th, placed in your ${ord(lordHouse)} house of ${HOUSE_THEME[lordHouse - 1]}. ` +
    `With ${aAn(elementOf(tenthSign))} ${elementOf(tenthSign)}-element 10th house, you are well suited to ${industries.slice(0, 3).join(", ")} and similar fields. ` +
    `${s.byKey.career >= 65 ? "Your professional foundations are strong — aim high and take ownership." : "Build your career patiently; consistent skill-building will pay off steadily."} ` +
    `In your chart specifically, the decisive factors are ${noteFor("career")}.` +
    (karakamsaNote ? ` ${karakamsaNote}` : "");

  // 4. Money
  const wealthYoga = f.yogas.find((y) => y.name.includes("Dhana") || y.name.includes("Lakshmi"));
  const money =
    `Your wealth houses read ${band(f.houseStrength[2])} (savings/2nd) and ${band(f.houseStrength[11])} (income/11th). ` +
    `${wealthYoga ? `${wealthYoga.name} supports money formation. ` : ""}` +
    `${s.byKey.wealth >= 65 ? "Wealth can accumulate well — favour disciplined investing over impulsive spending." : "Focus first on stable income and a savings habit before taking financial risks."} ` +
    `Here the decisive factors are ${noteFor("wealth")}.`;

  // 5. Relationships
  const seventhSign = f.signOfHouse(7);
  const relationships =
    `Your 7th house falls in ${RASHI_NAMES[seventhSign]}, suggesting a partner who is ${SIGN_TRAIT[seventhSign]}. ` +
    `Venus, the planet of love, is ${utilLabel(ps("Venus")).toLowerCase()} in your chart. ` +
    `${s.byKey.relationships >= 65 ? "Partnerships are a source of strength and balance for you." : "Relationships ask for patience and clear communication to truly flourish."} ` +
    `The decisive factors here are ${noteFor("relationships")}.` +
    (upapadaNote ? ` ${upapadaNote}` : "");

  // 6. Personality
  const personality =
    `Outwardly you come across as ${SIGN_TRAIT[f.ascSign0]} (${RASHI_NAMES[f.ascSign0]} ascendant). ` +
    `Emotionally you are ${SIGN_TRAIT[f.planetSign0["Moon"]]} (${RASHI_NAMES[f.planetSign0["Moon"]]} Moon), ` +
    `and your mind works in a ${SIGN_TRAIT[f.planetSign0["Mercury"]]} way (${RASHI_NAMES[f.planetSign0["Mercury"]]} Mercury).`;

  // 7. Planet utilization
  const planetUse: PlanetUse[] = ALL.map((p) => ({
    planet: p,
    purpose: PURPOSE[p],
    strength: utilLabel(ps(p)),
    weakness: weaknessNote(f.dignity[p]?.state ?? "", ps(p)),
    activation: ACTIVATION[p],
    util: ps(p),
  }));

  // 8 & 9
  const yogakaraka = f.yogakaraka
    ? `${f.yogakaraka} is your Yogakaraka — the single most rewarding planet to strengthen, owning both an angle and a trine from your Lagna. It uplifts both status and fortune. Activate it: ${ACTIVATION[f.yogakaraka]}.`
    : `Your chart has no single classical Yogakaraka, so make your Ascendant lord ${lagnaLord} your focus planet instead. Activate it: ${ACTIVATION[lagnaLord]}.`;
  const bhagyaHouse = f.planetHouse[f.bhagyaLord];
  const bhagya =
    `Your fortune (9th) lord is ${f.bhagyaLord}, placed in the ${ord(bhagyaHouse)} house of ${HOUSE_THEME[bhagyaHouse - 1]}. ` +
    `Luck tends to open up through that area of life. Strengthen it: ${ACTIVATION[f.bhagyaLord]}.`;

  // 11. Strengths & weaknesses
  const ranked = [...s.scores].sort((a, b) => b.value - a.value);
  const strengths = ranked.slice(0, 3).map((x) => `${x.label} (${x.value}) — ${x.band}`);
  const weaknesses = ranked.slice(-3).reverse().map((x) => `${x.label} (${x.value}) — grow this`);

  // 14. Mahadasha
  const mahadasha = buildMahadasha(data, f);

  // 15. Transits
  const transits = (k.transit?.planets ?? [])
    .filter((p) => ["Saturn", "Jupiter", "Rahu", "Ketu"].includes(p.planet))
    .map((p) => ({
      planet: p.planet, sign: p.sign, house: p.houseFromMoon,
      effect: (GOOD_FROM_MOON[p.planet] ?? []).includes(p.houseFromMoon)
        ? "a supportive transit — use this window to push forward"
        : "a testing transit — be patient and avoid overreach",
    }));

  // 16. Lucky factors
  const av = k.avkahada;
  const num = getNumerology(data.input.localDate, data.name);
  const lucky = {
    numbers: [...new Set([...(av?.favourable.luckyNumbers ?? []), ...num.luckyNumbers])].join(", "),
    days: [...new Set([...(av?.favourable.luckyDays ?? []), ...num.luckyDays])].join(", "),
    colors: (av?.favourable.luckyColors ?? []).join(", "),
    gem: av?.favourable.gemstone ?? "—",
    direction: av?.favourable.direction ?? "—",
    deity: av?.favourable.deity ?? "—",
  };

  // 17. Health
  const health =
    `Your vitality reads ${band(f.houseStrength[1])} (Lagna) with ${aAn(elementOf(f.ascSign0))} ${elementOf(f.ascSign0)} constitution. ` +
    `${elementLifestyle(elementOf(f.ascSign0))} ` +
    `In your chart the decisive factors are ${noteFor("health")}. ` +
    `This is lifestyle guidance for wellbeing, not medical advice.`;

  // 18. Action plan + 30-day activation
  const focusPlanet = f.yogakaraka ?? lagnaLord;
  const weakImportant = [lagnaLord, focusPlanet, f.atmakaraka].sort((a, b) => ps(a) - ps(b))[0];
  const actionPlan = {
    daily: [
      `Spend 10 quiet minutes each morning setting intention (strengthens ${f.atmakaraka}).`,
      `${ACTIVATION[focusPlanet]}.`,
      "Note one thing you did well and one to improve.",
    ],
    weekly: [
      `On ${dayOf(weakImportant)}, do a small act tied to ${weakImportant}: ${ACTIVATION[weakImportant]}.`,
      "Review your goals and money once a week.",
      "Give time or help to someone without expecting return.",
    ],
    monthly: [
      "Review progress against your top life-area scores.",
      `Donate something connected to your weakest planet (${weakImportant}).`,
      "Plan the month ahead around your favourable days.",
    ],
  };
  const activation30 = [
    { week: "Week 1", planet: lagnaLord, focus: ACTIVATION[lagnaLord] },
    { week: "Week 2", planet: focusPlanet, focus: ACTIVATION[focusPlanet] },
    { week: "Week 3", planet: weakImportant, focus: ACTIVATION[weakImportant] },
    { week: "Week 4", planet: f.atmakaraka, focus: ACTIVATION[f.atmakaraka] },
  ];

  // 19. Scorecard
  const scorecard: ScorecardRow[] = ALL.map((p) => {
    const base = ps(p) >= 65 ? "Leverage it freely" : `Strengthen — ${ACTIVATION[p].split("(")[0].trim()}`;
    const vc = f.vargaDignityCount[p] ?? 0;
    const amsa = amsaLabel(vc);
    const av = f.baladiAvastha[p];
    const parts: string[] = [];
    if (av) parts.push(`${av} avastha`);
    if (amsa) parts.push(`${amsa} (${vc}/10 vargas)`);
    parts.push(base);
    return {
      planet: p,
      strengthLabel: utilLabel(ps(p)),
      util: ps(p),
      tip: parts.join(" · "),
    };
  });

  // 20. Roadmap
  const roadmap = {
    purpose: `Lead your life toward ${PURPOSE[f.atmakaraka]}, expressed through ${HOUSE_THEME[8]}.`,
    career: `${careerText.split(". ").slice(-1)[0]}`,
    wealth: s.byKey.wealth >= 60 ? "Wealth is achievable — be disciplined and let it compound." : "Prioritise stable income and saving habits first.",
    opportunities: `Your best window is ${s.bestDecade ? `ages ${s.bestDecade.fromAge}–${s.bestDecade.toAge} (${s.bestDecade.planet} Mahadasha)` : "during your strongest dasha"}; ${ranked[0].label.toLowerCase()} is your strongest area.`,
    cautions: `Avoid neglecting ${ranked[ranked.length - 1].label.toLowerCase()}; don't let ${weakImportant} stay under-used.`,
  };

  return {
    s, lifeTheme, career: { text: careerText, industries }, money, relationships, personality,
    planetUse, yogakaraka, bhagya, numerology: num, strengths, weaknesses,
    yogas: f.yogas.filter((y) => y.tone !== "neutral"),
    mahadasha, transits, lucky, health, actionPlan, activation30, scorecard, roadmap,
  };
}

function band(v: number) { return v >= 80 ? "strong" : v >= 65 ? "good" : v >= 50 ? "moderate" : "developing"; }
function weaknessNote(dignity: string, util: number) {
  if (dignity === "Debilitated") return "can feel blocked until consciously developed";
  if (util < 50) return "under-used — needs deliberate strengthening";
  if (dignity === "Enemy") return "works against friction; patience helps";
  return "few obstacles — keep it active";
}
function elementLifestyle(el: string) {
  return {
    Fire: "Avoid burnout and excess heat; cool foods, hydration and rest restore you.",
    Earth: "Keep moving and vary routine; digestion and joints benefit from activity.",
    Air: "Calm the nervous system; regular sleep, breathwork and grounding help most.",
    Water: "Mind emotional eating and damp; warmth, movement and emotional outlets keep you well.",
  }[el] ?? "";
}
const DAY: Record<string, string> = {
  Sun: "Sunday", Moon: "Monday", Mars: "Tuesday", Mercury: "Wednesday",
  Jupiter: "Thursday", Venus: "Friday", Saturn: "Saturday", Rahu: "Saturday", Ketu: "Tuesday",
};
const dayOf = (p: string) => DAY[p] ?? "Sunday";

function buildMahadasha(data: KundliResponse, f: Factors) {
  const mds = data.kundli.dasha?.mahadashas ?? [];
  const now = Date.now();
  const idx = mds.findIndex((m) => now >= new Date(m.startTime).getTime() && now < new Date(m.endTime).getTime());
  const pick = idx >= 0 ? mds.slice(idx, idx + 3) : mds.slice(0, 3);
  return pick.map((m, i) => {
    const str = f.planetStrength[m.planet] ?? 45;
    const tag = i === 0 ? "Current" : "Upcoming";
    const tone = str >= 60
      ? "a favourable period — push your goals and take opportunities"
      : "a period for patience, consolidation and steady effort";
    return {
      title: `${tag}: ${m.planet} Mahadasha (until ${new Date(m.endTime).getFullYear()})`,
      text: `${m.planet} governs ${PURPOSE[m.planet]}. With its strength at ${str}/100, this is ${tone}.`,
    };
  });
}
