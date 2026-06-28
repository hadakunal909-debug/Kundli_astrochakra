// ─────────────────────────────────────────────────────────────────────────────
//  PREMIUM SCORING CONFIG  —  the single place to tune the astrology engine.
//
//  Every number the scoring logic uses lives here. Astrologers can adjust these
//  values to match their house style WITHOUT touching any engine code. After an
//  edit, just reload the app.
//
//  Rule of thumb: the blend weights in each "weights" block should add up to 1.0.
// ─────────────────────────────────────────────────────────────────────────────

export const PREMIUM_CONFIG = {
  // ── 1. Planet strength blend (0–100). Weights should sum to ~1.0. ──
  // How much each classical factor contributes to a planet's overall strength.
  planetWeights: {
    dignity: 0.35,       // graded sign dignity (exaltation → debilitation)
    shadbala: 0.30,      // six-fold strength
    ashtakavarga: 0.15,  // the planet's own bindus in its sign
    drishti: 0.10,       // aspects received
    avastha: 0.10,       // combustion / retrogression state
  },
  // Rahu & Ketu have no Shadbala, so they use their own blend.
  nodeWeights: { dignity: 0.60, ashtakavarga: 0.20, drishti: 0.20 },

  // ── 2. Dignity grades (0–100). The score a planet gets for each sign-state. ──
  dignityGrades: {
    Exalted: 95, Moolatrikona: 90, Own: 85, "Great Friend": 72, Friend: 62,
    Neutral: 50, Enemy: 35, "Great Enemy": 22, Debilitated: 10,
  } as Record<string, number>,
  neechaBhangaScore: 64,   // a debilitated planet rises to this when cancellation applies
  vargottamaBonus: 8,      // bonus when a planet is in the same sign in D1 & D9
  nodeDignity: { exalt: 85, debil: 20, dispositorWeight: 0.6, dispositorBase: 20 },

  // ── 3. Avastha (planetary state), expressed on a 0–100 scale around 50. ──
  avastha: { base: 50, combustPenalty: 25, retroBonus: 15 },

  // ── 4. House (Bhava) strength blend + adjustments. ──
  houseWeights: { lord: 0.35, sav: 0.20, karaka: 0.15, neutralBase: 15 },
  houseAdjust: {
    occupantPerPlanet: 8, occupantCap: 14,   // functional benefic/malefic occupants
    aspectMult: 1.2, aspectCap: 14,          // aspects onto the house
    lordInGoodHouse: 5, lordInDusthana: -5,  // where the house lord sits
    argalaMult: 3, argalaCap: 12,            // net argala (intervention from 2/4/11, obstructed by 12/10/3)
  },

  // ── 5. Functional nature factor (−1 … +1). Drives dasha quality & aspects. ──
  functionalFactor: { yogakaraka: 1, benefic: 0.6, neutral: 0, maraka: -0.4, malefic: -0.6 },

  // ── 6. Aspect (drishti) scoring. Each aspect is capped to ±cap. ──
  aspect: { baseMagnitude: 5, targetNudge: 1, cap: 5 },

  // ── 7. Dasha / "Most Empowered Period" scoring. ──
  dasha: {
    functionalMult: 0.35,   // how much functional nature scales raw strength
    yogaBonus: 10,          // lord is a Yogakaraka or in a Raja/Dhana yoga
    goodHouseBonus: 6,      // lord in 1/4/5/7/9/10
    dusthanaPenalty: -8,    // lord in 6/8/12
    durationWeight: 0.4, durationCap: 18,
  },

  // ── 7b. Dasavarga (divisional-chart) corroboration. Parasara grades a planet by
  //  how many of the ten vargas (D1,D2,D3,D7,D9,D10,D12,D16,D30,D60) it sits
  //  dignified (own/exalt/moolatrikona) in — the "amsa" strength. This adds a bonus
  //  to planet strength and to the strength grade of yogas the planet forms. ──
  dasavarga: {
    planetPerVarga: 1.4, planetCap: 14,  // bonus to a planet's 0–100 strength
    yogaPerVarga: 1.2, yogaCap: 10,      // bonus to a yoga's 0–100 strength grade
  },

  // ── 7c. Orb of a conjunction. A yoga formed by a close conjunction (within
  //  fullDeg) gives full results; as the participants spread past fullDeg toward
  //  wideDeg, the yoga's strength grade is reduced by up to `penalty` points. ──
  orb: { fullDeg: 6, wideDeg: 13, penalty: 12 },

  // ── 7d. Baladi avastha (age state by degree-in-sign): a planet at "youth" (mid
  //  sign) is fully effective; "child"/"old" partial; "dead" (sign edges) least.
  //  `penalty` is the max points a fully-ineffective (dead) planet loses. ──
  baladi: { penalty: 12 },

  // ── 8. Score band thresholds (label shown next to each score). ──
  bands: { strong: 80, good: 65, moderate: 50 },

  // ── 8b. Contrast & combination swings — what stops scores looking "generic". ──
  // stretch pushes scores away from the bland middle; modifierCap limits how far
  // named yogas/doshas/afflictions can move an area.
  contrast: { stretch: 1.5, modifierCap: 34 },

  // ── 9. Life-area significator weights (each block should sum to ~1.0). ──
  //  Tweak these to emphasise different houses/planets/divisional charts.
  lifeAreas: {
    career:          { h10: 0.30, lord10: 0.15, karakas: 0.15, d10: 0.25, amatyakaraka: 0.15, rajaBonus: 4 },
    wealth:          { h2: 0.20, h11: 0.20, lords: 0.15, jupiter: 0.10, d2: 0.20, d4: 0.15, dhanaBonus: 5 },
    relationships:   { h7: 0.35, lord7: 0.15, venus: 0.20, d9: 0.30 },
    leadership:      { h1: 0.25, h10: 0.25, sun: 0.30, lord1: 0.20, rajaBonus: 4 },
    entrepreneurship:{ h3: 0.15, h10: 0.15, h11: 0.15, h7: 0.10, marsRahu: 0.15, h1: 0.15, d3: 0.15 },
    foreign:         { h12: 0.35, h9: 0.20, h3: 0.15, rahu: 0.15, lord12: 0.15 },
    hiddenTalents:   { h5: 0.30, h3: 0.15, mercury: 0.20, ketu: 0.10, d24: 0.25 },
    health:          { h1: 0.35, lord1: 0.20, moon: 0.15, sun: 0.10, d30: 0.20 },
    lifePurpose:     { h1: 0.20, h9: 0.20, h10: 0.15, h5: 0.10, atmakaraka: 0.20, d20: 0.15, yogaPerYoga: 2, yogaCap: 8 },
  },
};

export type PremiumConfig = typeof PREMIUM_CONFIG;
