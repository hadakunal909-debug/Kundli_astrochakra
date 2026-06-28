import type { DignityInfo } from "./dignity";
import { PREMIUM_CONFIG as CFG } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
//  COMPREHENSIVE CLASSICAL YOGA ENGINE
//
//  Detects the full recognised catalogue of Vedic yogas across every major
//  category — Pancha Mahapurusha, Raja, Dhana, Surya, Chandra, Parivartana,
//  Nabhasa (Sankhya / Asraya / Dala / Akriti) and the named auspicious & arishta
//  (affliction) yogas. Each result carries a category, a tone (for colour) and,
//  where its participating planets are well-defined, a 0–100 strength grade so
//  the report can show how strongly a yoga actually fructifies — not just whether
//  it is present. Classical definitions follow Parasara / standard texts; all
//  prose here is original.
//
//  Two planets are "associated" if conjunct, in mutual graha-drishti, or in sign
//  exchange. House numbers are 1..12 from the Lagna; sign indices are 0..11.
// ─────────────────────────────────────────────────────────────────────────────

export type YogaCategory =
  | "Mahapurusha" | "Raja" | "RajaSambandha" | "Dhana" | "Surya" | "Chandra"
  | "Parivartana" | "Nabhasa" | "Auspicious" | "Affliction";

export type YogaTone = "good" | "bad" | "neutral";

export interface DetectedYoga {
  name: string;
  detail: string;
  category: YogaCategory;
  tone: YogaTone;
  strength?: number; // 0–100, present for yogas with well-defined participants
}

export interface YogaContext {
  house: Record<string, number>;        // planet -> house 1..12 from Lagna
  sign0: Record<string, number>;        // planet -> sign index 0..11
  dignity: Record<string, DignityInfo>;
  owned: Record<string, number[]>;      // classical planet -> houses owned
  moonWaxing: boolean;                  // Shukla paksha (benefic Moon)
  ascSign0: number;                     // ascendant sign index 0..11
  vargaDignityCount: Record<string, number>; // 0–10 dignified Dasavarga charts per planet
  lon: Record<string, number>;          // planet -> ecliptic longitude 0..360 (for conjunction orb)
  amatyakaraka: string;                 // chara Amatyakaraka (AmK) planet
  atmakaraka: string;                   // chara Atmakaraka (AK) planet
  arudhaSign0: number;                  // Arudha Lagna sign index 0..11 (-1 if unavailable)
}

const SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const ALL9 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const SANS_MOON = ["Sun", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const TARA = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // grahas excluding luminaries & nodes
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const UPACHAYA = [3, 6, 10, 11];
const MOVABLE = [0, 3, 6, 9];   // Aries, Cancer, Libra, Capricorn
const FIXED = [1, 4, 7, 10];    // Taurus, Leo, Scorpio, Aquarius
const DUAL = [2, 5, 8, 11];     // Gemini, Virgo, Sagittarius, Pisces
const DIGNIFIED = ["Own", "Exalted", "Moolatrikona"];

// sign index -> ruling planet
const RL = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
// special (full) aspects beyond the universal 7th
const SP: Record<string, number[]> = { Jupiter: [5, 7, 9], Mars: [4, 7, 8], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9] };
const MAHAPURUSHA: Record<string, string> = { Mars: "Ruchaka", Mercury: "Bhadra", Jupiter: "Hamsa", Venus: "Malavya", Saturn: "Sasa" };

const ord = (n: number) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
const span = (start: number, len: number) => Array.from({ length: len }, (_, i) => ((start - 1 + i) % 12) + 1);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function detectYogas(ctx: YogaContext): DetectedYoga[] {
  const { house, sign0, dignity, owned, moonWaxing, ascSign0, vargaDignityCount, lon, amatyakaraka, atmakaraka, arudhaSign0 } = ctx;
  const out: DetectedYoga[] = [];

  const present = (p: string) => sign0[p] !== undefined;
  const st = (p: string) => dignity[p]?.state ?? "";
  const dignified = (p: string) => DIGNIFIED.includes(st(p));
  const benefic = (p: string) => p === "Jupiter" || p === "Venus" || p === "Mercury" || (p === "Moon" && moonWaxing);

  // Strength of a yoga from the dignity, avastha and placement of its participants.
  const strengthOf = (parts: string[]): number | undefined => {
    const ps = parts.filter(present);
    if (!ps.length) return undefined;
    let sum = 0;
    for (const p of ps) {
      let v = dignity[p]?.score ?? 50;
      if (dignity[p]?.combust) v -= 18;
      if (st(p) === "Debilitated") v -= 12;
      if ([1, 4, 5, 7, 9, 10].includes(house[p])) v += 8;
      else if (DUSTHANA.includes(house[p])) v -= 8;
      v += Math.min(CFG.dasavarga.yogaCap, (vargaDignityCount[p] ?? 0) * CFG.dasavarga.yogaPerVarga); // Dasavarga amsa strength
      sum += clamp(v);
    }
    let val = sum / ps.length;
    // Orb: a wide conjunction among participants weakens the yoga (§ magnitude of a yoga).
    const O = CFG.orb;
    let minSep = Infinity;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j];
      if (sign0[a] === sign0[b] && lon[a] !== undefined && lon[b] !== undefined) {
        const d = Math.abs(lon[a] - lon[b]) % 360;
        minSep = Math.min(minSep, Math.min(d, 360 - d));
      }
    }
    if (minSep !== Infinity && minSep > O.fullDeg)
      val -= Math.min(1, (minSep - O.fullDeg) / (O.wideDeg - O.fullDeg)) * O.penalty;
    return clamp(val);
  };

  const add = (name: string, detail: string, category: YogaCategory, tone: YogaTone = "good", parts?: string[]) =>
    out.push({ name, detail, category, tone, strength: parts ? strengthOf(parts) : undefined });

  const aspH = (p: string, from: number, to: number) => (SP[p] ?? [7]).includes(((to - from + 12) % 12) + 1);
  const mutual = (a: string, b: string) => present(a) && present(b) && aspH(a, house[a], house[b]) && aspH(b, house[b], house[a]);
  const exch = (a: string, b: string) => present(a) && present(b) && RL[sign0[a]] === b && RL[sign0[b]] === a;
  const assoc = (a: string, b: string) => present(a) && present(b) && a !== b && (house[a] === house[b] || mutual(a, b) || exch(a, b));
  const how = (a: string, b: string) => (house[a] === house[b] ? "conjunct" : exch(a, b) ? "in a mutual sign exchange" : "in mutual aspect");
  const owner = (h: number): string | null => { for (const p of Object.keys(owned)) if (owned[p].includes(h)) return p; return null; };
  const fromMoon = (p: string) => (present(p) && present("Moon") ? ((sign0[p] - sign0["Moon"] + 12) % 12) + 1 : 0);
  const fromSun = (p: string) => (present(p) && present("Sun") ? ((sign0[p] - sign0["Sun"] + 12) % 12) + 1 : 0);
  const kendraTrikona = (h: number) => KENDRA.includes(h) || TRIKONA.includes(h);
  const mutualKendra = (a: string, b: string) => present(a) && present(b) && KENDRA.includes(((house[a] - house[b] + 12) % 12) + 1);
  const planets = SEVEN.filter(present);

  // ── 1. Pancha Mahapurusha ──
  for (const p of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
    if (KENDRA.includes(house[p]) && dignified(p))
      add(`${MAHAPURUSHA[p]} Yoga`, `${p} is dignified in an angular house — a Pancha Mahapurusha yoga giving lasting strength of character.`, "Mahapurusha", "good", [p]);
  }

  // ── 2. Surya (Sun) yogas ──
  if (present("Sun")) {
    const sun2 = TARA.filter((p) => present(p) && fromSun(p) === 2);
    const sun12 = TARA.filter((p) => present(p) && fromSun(p) === 12);
    if (sun2.length) add("Vesi Yoga", `${sun2.join(" & ")} occupy the 2nd from the Sun — a Vesi yoga supporting steady speech, focus and good standing.`, "Surya", "good", sun2);
    if (sun12.length) add("Vasi Yoga", `${sun12.join(" & ")} occupy the 12th from the Sun — a Vasi yoga that aids skill, charity and quiet influence.`, "Surya", "good", sun12);
    if (sun2.length && sun12.length) add("Ubhayachari Yoga", "Planets flank the Sun on both sides (2nd and 12th) — an Ubhayachari yoga for all-round capability and repute.", "Surya", "good", [...sun2, ...sun12]);
    if (house["Sun"] === house["Mercury"]) add("Budhaditya Yoga", "Sun and Mercury together sharpen intelligence, communication and analytical skill.", "Surya", "good", ["Sun", "Mercury"]);
  }

  // ── 3. Chandra (Moon) yogas ──
  if (present("Moon")) {
    const moon2 = TARA.filter((p) => present(p) && fromMoon(p) === 2);
    const moon12 = TARA.filter((p) => present(p) && fromMoon(p) === 12);
    if (moon2.length) add("Sunapha Yoga", `${moon2.join(" & ")} occupy the 2nd from the Moon — a Sunapha yoga giving self-earned wealth and a capable mind.`, "Chandra", "good", [...moon2, "Moon"]);
    if (moon12.length) add("Anapha Yoga", `${moon12.join(" & ")} occupy the 12th from the Moon — an Anapha yoga giving health, character and comforts.`, "Chandra", "good", [...moon12, "Moon"]);
    if (moon2.length && moon12.length) add("Durudhara Yoga", "Planets flank the Moon on both sides — a Durudhara yoga for wealth, generosity and enjoyment of life.", "Chandra", "good", [...moon2, ...moon12, "Moon"]);

    // Kemadruma (corrected per §11.3.4): nothing beside the Moon (1st/2nd/12th from it,
    // excluding the Sun) AND no planet other than the Moon in a kendra from the LAGNA.
    const withMoon = TARA.filter((p) => present(p) && house[p] === house["Moon"]);
    const kendraFromLagna = SANS_MOON.filter((p) => present(p) && KENDRA.includes(house[p]));
    if (!moon2.length && !moon12.length && !withMoon.length && !kendraFromLagna.length)
      add("Kemadruma Yoga", "The Moon stands alone — nothing beside it (1st/2nd/12th) and no planet in an angle from the Lagna — a Kemadruma yoga that can unsettle the mind and fortune (and blunt other lunar yogas) until consciously countered.", "Affliction", "bad");

    const adhi = ["Mercury", "Jupiter", "Venus"].filter((p) => present(p) && [6, 7, 8].includes(fromMoon(p)));
    if (adhi.length >= 2) add("Chandra-Adhi Yoga", `Benefics (${adhi.join(", ")}) occupy the 6th–8th from the Moon — an Adhi yoga conferring leadership, wealth and a commanding position.`, "Chandra", "good", adhi);

    // Gajakesari (tightened per §11.6): Jupiter angular from the Moon and not
    // debilitated / combust / in an enemy sign.
    const jupClean = !["Debilitated", "Enemy", "Great Enemy"].includes(st("Jupiter")) && !dignity["Jupiter"]?.combust;
    if (KENDRA.includes(fromMoon("Jupiter")) && jupClean)
      add("Gajakesari Yoga", "Jupiter sits in an angle from the Moon, undimmed by debilitation or combustion — supports wisdom, reputation and steady fortune.", "Chandra", "good", ["Jupiter", "Moon"]);
  }
  // Chandra-Mangala (conjunction only, per §11.3.5).
  if (present("Moon") && present("Mars") && house["Moon"] === house["Mars"])
    add("Chandra-Mangal Yoga", "Moon and Mars are conjunct — a money-making combination with strong drive in finance and enterprise.", "Dhana", "good", ["Moon", "Mars"]);

  // ── 4. Dhana (wealth) yogas ──
  const DHANA: Record<number, string> = { 2: "wealth (2nd)", 5: "purva-punya (5th)", 9: "fortune (9th)", 11: "gains (11th)" };
  const dhanaLords = [2, 5, 9, 11].map((h) => [h, owner(h)] as const).filter(([, l]) => l) as [number, string][];
  for (let i = 0; i < dhanaLords.length; i++) for (let j = i + 1; j < dhanaLords.length; j++) {
    const [ha, a] = dhanaLords[i], [hb, b] = dhanaLords[j];
    if (a !== b && assoc(a, b)) add(`Dhana Yoga (${[a, b].sort().join(" & ")})`, `The lords of ${DHANA[ha]} and ${DHANA[hb]} are ${how(a, b)} — a wealth-forming combination.`, "Dhana", "good", [a, b]);
  }
  const lagnaLord = owner(1), ninthLord = owner(9);
  // Lakshmi (§ "Lakshmi Yoga"): 9th lord dignified in a kendra from Lagna, strong Lagna lord.
  if (ninthLord && dignified(ninthLord) && KENDRA.includes(house[ninthLord]) && lagnaLord && kendraTrikona(house[lagnaLord]))
    add("Lakshmi Yoga", `The 9th lord ${ninthLord} is dignified in an angle while the Lagna lord ${lagnaLord} is well-placed — a Lakshmi yoga for sustained prosperity, grace and good name.`, "Dhana", "good", [ninthLord, lagnaLord]);
  const vasu = ["Mercury", "Jupiter", "Venus"].filter((p) => present(p) && UPACHAYA.includes(house[p]));
  if (vasu.length >= 2) add("Vasumati Yoga", `Benefics (${vasu.join(", ")}) occupy upachaya houses (3/6/10/11) — a Vasumati yoga for self-made wealth and financial independence.`, "Dhana", "good", vasu);

  // Lagna-specific "Maharaja" Dhana combinations (Parasara, one set per ascendant):
  //   (a) a given planet in the 5th with given planet(s) in the 11th, OR
  //   (b) the Lagna lord in the Lagna conjoined/aspected by given planets.
  const DHANA_LAGNA: Record<number, { a5: string; a11: string[]; bLord: string; bWith: string[] }> = {
    0:  { a5: "Sun",     a11: ["Saturn", "Moon", "Jupiter"], bLord: "Mars",    bWith: ["Mercury", "Venus", "Saturn"] },
    1:  { a5: "Mercury", a11: ["Moon", "Mars", "Jupiter"],   bLord: "Venus",   bWith: ["Mercury", "Saturn"] },
    2:  { a5: "Venus",   a11: ["Mars"],                      bLord: "Mercury", bWith: ["Jupiter", "Saturn"] },
    3:  { a5: "Mars",    a11: ["Venus"],                     bLord: "Moon",    bWith: ["Mercury", "Jupiter"] },
    4:  { a5: "Jupiter", a11: ["Mercury"],                   bLord: "Sun",     bWith: ["Mars", "Jupiter"] },
    5:  { a5: "Saturn",  a11: ["Sun", "Moon"],               bLord: "Mercury", bWith: ["Jupiter", "Saturn"] },
    6:  { a5: "Saturn",  a11: ["Sun", "Moon"],               bLord: "Venus",   bWith: ["Mercury", "Saturn"] },
    7:  { a5: "Jupiter", a11: ["Mercury"],                   bLord: "Mars",    bWith: ["Mercury", "Venus", "Saturn"] },
    8:  { a5: "Mars",    a11: ["Venus"],                     bLord: "Jupiter", bWith: ["Mars", "Mercury"] },
    9:  { a5: "Venus",   a11: ["Mars"],                      bLord: "Saturn",  bWith: ["Mars", "Jupiter"] },
    10: { a5: "Mercury", a11: ["Moon", "Mars", "Jupiter"],   bLord: "Saturn",  bWith: ["Mars", "Jupiter"] },
    11: { a5: "Moon",    a11: ["Moon"],                      bLord: "Jupiter", bWith: ["Mars", "Mercury"] },
  };
  const lc = DHANA_LAGNA[ascSign0];
  if (lc) {
    const aspectsOrIn1 = (p: string) => present(p) && (house[p] === 1 || aspH(p, house[p], 1));
    const condA = present(lc.a5) && house[lc.a5] === 5 && lc.a11.every((p) => present(p) && house[p] === 11);
    const condB = present(lc.bLord) && house[lc.bLord] === 1 && lc.bWith.every(aspectsOrIn1);
    if (condA || condB)
      add("Maharaja Dhana Yoga", "A classical Lagna-specific wealth combination is present — strong potential for affluence built through the chart's own resources.", "Dhana", "good", condA ? [lc.a5, ...lc.a11] : [lc.bLord, ...lc.bWith]);
  }

  // ── 5. Raja yogas ──
  const kL = [...new Set([owner(1), owner(4), owner(7), owner(10)].filter(Boolean) as string[])];
  const tL = [...new Set([owner(1), owner(5), owner(9)].filter(Boolean) as string[])];
  for (const a of kL) for (const b of tL) if (a !== b && assoc(a, b))
    add(`Raja Yoga (${[a, b].sort().join(" & ")})`, `The angle lord ${a} and trine lord ${b} are ${how(a, b)} — a Raja yoga raising status, authority and success.`, "Raja", "good", [a, b]);
  const tenthLord = owner(10);
  if (ninthLord && tenthLord && ninthLord !== tenthLord && assoc(ninthLord, tenthLord))
    add("Dharma-Karmadhipati Raja Yoga", `The 9th lord ${ninthLord} and 10th lord ${tenthLord} are ${how(ninthLord, tenthLord)} — the most powerful Raja yoga, uniting fortune with career.`, "Raja", "good", [ninthLord, tenthLord]);
  for (const p of SEVEN) {
    const o = owned[p] ?? [];
    if (o.some((h) => [4, 7, 10].includes(h)) && o.some((h) => [5, 9].includes(h)))
      add(`Yogakaraka Raja Yoga (${p})`, `${p} rules both an angle and a trine — a Yogakaraka carrying a built-in Raja yoga.`, "Raja", "good", [p]);
  }
  // Kahala (per §11.6): 4th lord & Jupiter in mutual angles with a strong Lagna lord,
  // OR a dignified 4th lord joined by the 10th lord.
  const fourthLord = owner(4);
  const lagnaStrong = !!lagnaLord && (dignified(lagnaLord) || [1, 4, 5, 7, 9, 10].includes(house[lagnaLord]));
  const kahalaA = fourthLord && mutualKendra(fourthLord, "Jupiter") && lagnaStrong;
  const kahalaB = fourthLord && dignified(fourthLord) && tenthLord && house[tenthLord] === house[fourthLord];
  if (kahalaA || kahalaB)
    add("Kahala Yoga", `The 4th lord ${fourthLord} is strongly linked to ${kahalaA ? "Jupiter" : "the 10th lord"} — a Kahala yoga for boldness, resources and command.`, "Raja", "good", [fourthLord!, "Jupiter"]);
  // Vipareeta Raja yogas (tightened): a clean dusthana lord in a dusthana, or reinforced.
  const VIP: Record<number, string> = { 6: "Harsha", 8: "Sarala", 12: "Vimala" };
  const dusLords = DUSTHANA.map((h) => owner(h));
  for (const h of DUSTHANA) {
    const l = owner(h);
    if (!l || !DUSTHANA.includes(house[l])) continue;
    const ownsGood = (owned[l] ?? []).some((x) => kendraTrikona(x));
    const linked = dusLords.some((o) => !!o && o !== l && assoc(l, o));
    if (ownsGood && !linked) continue;
    const where = house[l] === h ? "its own dusthana" : `the ${ord(house[l])} house`;
    const why = linked ? ", reinforced by another dusthana lord," : "";
    add(`${VIP[h]} Vipareeta Raja Yoga`, `The ${ord(h)} lord ${l} sits in ${where}${why} — a Vipareeta Raja yoga that turns early adversity into later rise.`, "Raja", "good", [l]);
  }
  for (const p of SEVEN) if (dignity[p]?.neechaBhanga)
    add(`Neecha Bhanga Raja Yoga (${p})`, `${p}'s debilitation is cancelled — a Neecha Bhanga Raja yoga that turns a fallen planet into a source of rise.`, "Raja", "good", [p]);

  // ── 6. Parivartana (sign-exchange) yogas ──
  const seenPair = new Set<string>();
  for (let ha = 1; ha <= 12; ha++) {
    const la = owner(ha); if (!la) continue;
    const hb = house[la]; if (hb === ha) continue;
    const lb = owner(hb); if (!lb || lb === la || house[lb] !== ha) continue; // true mutual exchange
    const key = [ha, hb].sort((x, y) => x - y).join("-");
    if (seenPair.has(key)) continue; seenPair.add(key);
    if (DUSTHANA.includes(ha) || DUSTHANA.includes(hb))
      add(`Dainya Parivartana (${ord(ha)}–${ord(hb)})`, `The ${ord(ha)} and ${ord(hb)} lords exchange signs, involving a dusthana — a Dainya parivartana: struggle that ultimately builds resilience.`, "Parivartana", "bad");
    else if (ha === 3 || hb === 3)
      add(`Khala Parivartana (${ord(ha)}–${ord(hb)})`, `The ${ord(ha)} and ${ord(hb)} lords exchange signs (involving the 3rd) — a Khala parivartana giving mixed but self-made results.`, "Parivartana", "neutral");
    else
      add(`Maha Parivartana (${ord(ha)}–${ord(hb)})`, `The ${ord(ha)} and ${ord(hb)} lords exchange signs — a Maha parivartana strongly fusing these two areas of life.`, "Parivartana", "good", [la, lb]);
  }

  // ── 7. Named auspicious yogas ──
  const SARA_H = [1, 2, 4, 5, 7, 9, 10];
  if (["Mercury", "Jupiter", "Venus"].every((p) => present(p) && SARA_H.includes(house[p])) && st("Jupiter") !== "Debilitated")
    add("Saraswati Yoga", "Mercury, Jupiter and Venus all hold angles, trines or the 2nd — a Saraswati yoga for exceptional learning, speech, art and intellect.", "Auspicious", "good", ["Mercury", "Jupiter", "Venus"]);
  if (present("Jupiter") && [2, 5].includes(house["Jupiter"]) && (assoc("Jupiter", "Mercury") || assoc("Jupiter", "Venus")))
    add("Kalanidhi Yoga", "Jupiter occupies the 2nd/5th in the company of Mercury/Venus — a Kalanidhi yoga for scholarship, refinement and respect.", "Auspicious", "good", ["Jupiter"]);
  // Amala (corrected): ONLY benefics (no malefic) in the 10th from Lagna or Moon.
  const tenthFromMoon = present("Moon") ? (sign0["Moon"] + 9) % 12 : -1;
  const occL10 = ALL9.filter((p) => present(p) && house[p] === 10);
  const occM10 = ALL9.filter((p) => present(p) && sign0[p] === tenthFromMoon);
  const amalaOK = (occ: string[]) => occ.length > 0 && occ.some(benefic) && !occ.some((p) => !benefic(p));
  if (amalaOK(occL10) || (tenthFromMoon >= 0 && amalaOK(occM10)))
    add("Amala Yoga", "Only benefics occupy the 10th from the Lagna/Moon — an Amala yoga for a spotless reputation and lasting good name.", "Auspicious", "good", (amalaOK(occL10) ? occL10 : occM10).filter(benefic));
  if (lagnaLord && st(lagnaLord) === "Exalted" && KENDRA.includes(house[lagnaLord]))
    add("Chamara Yoga", `The Lagna lord ${lagnaLord} is exalted in an angle — a Chamara yoga for long life, learning and eloquence.`, "Auspicious", "good", [lagnaLord]);

  // ── 7b. Further named yogas (Other Popular Yogas) ──
  const lord2 = owner(2), lord5 = owner(5), lord6 = owner(6), lord7 = owner(7);
  const occOf = (h: number) => ALL9.filter((p) => present(p) && house[p] === h);
  const houseHasBenefic = (h: number) => occOf(h).some(benefic);
  const houseHasMalefic = (h: number) => occOf(h).some((p) => !benefic(p));
  const nthFrom = (ref: number, n: number) => ((ref - 1 + (n - 1)) % 12) + 1;
  const strongL = (p: string | null) => !!p && present(p) && (dignified(p) || [1, 4, 5, 7, 9, 10].includes(house[p]));
  const opp = (a: string, b: string) => present(a) && present(b) && (((house[a] - house[b] + 12) % 12) + 1) === 7;

  // Guru-Mangala — Jupiter & Mars conjunct or opposed.
  if (present("Jupiter") && present("Mars") && (house["Jupiter"] === house["Mars"] || opp("Jupiter", "Mars")))
    add("Guru-Mangala Yoga", `Jupiter and Mars are ${house["Jupiter"] === house["Mars"] ? "conjunct" : "in mutual opposition"} — channels drive and energy into principled, purposeful action.`, "Auspicious", "good", ["Jupiter", "Mars"]);

  // Trilochana — Sun, Moon and Mars in one elemental trine (mutual trines).
  if (["Sun", "Moon", "Mars"].every(present) && sign0["Sun"] % 4 === sign0["Moon"] % 4 && sign0["Moon"] % 4 === sign0["Mars"] % 4)
    add("Trilochana Yoga", "Sun, Moon and Mars share one elemental trine — a Trilochana yoga for vitality, intelligence, longevity and victory over obstacles.", "Auspicious", "good", ["Sun", "Moon", "Mars"]);

  // Parvata — only benefics in the angles, and the 7th/8th free of malefics.
  if ([1, 4, 7, 10].some(houseHasBenefic) && ![1, 4, 7, 10].some(houseHasMalefic) && !houseHasMalefic(8))
    add("Parvata Yoga", "Benefics hold the angles with the 7th/8th free of malefics — a Parvata yoga for fortune, eloquence, fame and an easy-going nature.", "Auspicious", "good", [1, 4, 7, 10].flatMap(occOf).filter(benefic));

  // Subha Kartari — the Lagna enclosed by benefics in the 2nd & 12th.
  if (houseHasBenefic(2) && !houseHasMalefic(2) && houseHasBenefic(12) && !houseHasMalefic(12))
    add("Subha Kartari Yoga", "Benefics flank the Lagna (2nd and 12th) — a protective subha-kartari enclosure for character, good looks and ease of life.", "Auspicious", "good", [...occOf(2), ...occOf(12)].filter(benefic));

  // Sankha — wealth, family and longevity.
  if ((strongL(lagnaLord) && !!lord5 && !!lord6 && mutualKendra(lord5, lord6)) ||
      (!!lagnaLord && !!tenthLord && house[lagnaLord] === house[tenthLord] && MOVABLE.includes(sign0[lagnaLord]) && strongL(ninthLord)))
    add("Sankha Yoga", "A Sankha yoga formed by well-linked trine/angle lords — blessings of wealth, family and a long, principled life.", "Auspicious", "good", [lagnaLord!]);

  // Bheri — prosperity, family and fame.
  if (strongL(ninthLord) && ([1, 2, 7, 12].every((h) => occOf(h).length > 0) ||
      (!!lagnaLord && mutualKendra("Jupiter", "Venus") && mutualKendra("Venus", lagnaLord) && mutualKendra("Jupiter", lagnaLord))))
    add("Bheri Yoga", "A Bheri yoga anchored by a strong 9th lord — wealth, spouse, children, fame and an enjoyable, virtuous life.", "Auspicious", "good", [ninthLord!]);

  // Khadga — a 2nd/9th exchange with a well-placed Lagna lord.
  if (!!lord2 && !!ninthLord && house[lord2] === 9 && house[ninthLord] === 2 && !!lagnaLord && kendraTrikona(house[lagnaLord]))
    add("Khadga Yoga", "The 2nd and 9th lords exchange signs while the Lagna lord is well-placed — a Khadga yoga for skill, wealth, learning and fortune.", "Auspicious", "good", [lord2, ninthLord]);

  // Kalpadruma (Parijata) — the Lagna-lord dispositor chain rests in angles/trines/exaltation.
  if (lagnaLord) {
    const d1 = RL[sign0[lagnaLord]];
    const d2 = present(d1) ? RL[sign0[d1]] : null;
    const restsWell = (p: string | null) => !!p && present(p) && (kendraTrikona(house[p]) || st(p) === "Exalted");
    if (restsWell(lagnaLord) && restsWell(d1) && restsWell(d2))
      add("Kalpadruma Yoga", "The Lagna lord and its dispositor chain all rest in angles, trines or exaltation — a Kalpadruma (Parijata) yoga for prosperity, principle and strength.", "Raja", "good", [lagnaLord, d1, d2!]);
  }

  // Trimurti — Hari / Hara / Brahma (benefics in specific houses from key lords).
  if (!!lord2 && [2, 12, 8].every((n) => houseHasBenefic(nthFrom(house[lord2], n))))
    add("Hari Yoga", "Benefics fill the sustaining houses reckoned from the 2nd lord — a Hari (Trimurti) yoga for happiness, learning, wealth and progeny.", "Auspicious", "good", ["Jupiter", "Venus", "Mercury"]);
  if (!!lord7 && [4, 9, 8].every((n) => houseHasBenefic(nthFrom(house[lord7], n))))
    add("Hara Yoga", "Benefics fill the key houses reckoned from the 7th lord — a Hara (Trimurti) yoga for happiness, learning, wealth and progeny.", "Auspicious", "good", ["Jupiter", "Venus", "Mercury"]);
  if (!!lagnaLord && [4, 10, 11].every((n) => houseHasBenefic(nthFrom(house[lagnaLord], n))))
    add("Brahma Yoga", "Benefics fill the creative houses reckoned from the Lagna lord — a Brahma (Trimurti) yoga for happiness, learning, wealth and progeny.", "Auspicious", "good", ["Jupiter", "Venus", "Mercury"]);

  // ── 7c. Further classical named yogas (rasi-computable subset of §11.6) ──
  const lord11 = owner(11);
  const trikonaHouse = (p: string) => TRIKONA.includes(house[p]);
  const exchLords = (a: string | null, b: string | null) => !!a && !!b && a !== b && exch(a, b);
  const beneficDignifiedIn = (h: number) => occOf(h).some((p) => benefic(p) && (dignity[p]?.score ?? 0) >= 62);
  const maleficDignifiedIn = (h: number) => occOf(h).some((p) => !benefic(p) && (dignity[p]?.score ?? 0) >= 85);
  const kendraFrom = (a: string, b: string) => present(a) && present(b) && KENDRA.includes(((house[a] - house[b] + 12) % 12) + 1);

  // Mridanga — two-plus dignified planets in angles/trines with a strong Lagna lord.
  const dignifiedKT = SEVEN.filter((p) => present(p) && dignified(p) && kendraTrikona(house[p]));
  if (dignifiedKT.length >= 2 && lagnaStrong)
    add("Mridanga Yoga", "Several dignified planets occupy angles and trines with a strong Lagna lord — a Mridanga yoga for happiness and a high station in life.", "Raja", "good", dignifiedKT);
  // Sreenatha — 7th lord exalted in the 10th, with the 10th lord joining the 9th lord.
  if (lord7 && st(lord7) === "Exalted" && house[lord7] === 10 && tenthLord && ninthLord && house[tenthLord] === house[ninthLord])
    add("Sreenatha Yoga", "An exalted 7th lord in the 10th with the 9th and 10th lords together — a Sreenatha yoga for exceptional standing and prosperity.", "Raja", "good", [lord7, tenthLord, ninthLord]);
  // Matsya — benefics in 1st & 9th, planets in the 5th, malefics in the 4th & 8th.
  if (houseHasBenefic(1) && houseHasBenefic(9) && occOf(5).length > 0 && houseHasMalefic(4) && houseHasMalefic(8))
    add("Matsya Yoga", "Benefics anchor the Lagna and the 9th while malefics hold the 4th and 8th — a Matsya yoga for insight, kindness and a seer-like intelligence.", "Auspicious", "good", [...occOf(1), ...occOf(9)].filter(benefic));
  // Koorma — dignified benefics in 5/6/7 and dignified malefics in 1/3/11.
  if ([5, 6, 7].every(beneficDignifiedIn) && [1, 3, 11].every(maleficDignifiedIn))
    add("Koorma Yoga", "Dignified benefics fill the 5th–7th while dignified malefics hold the 1st, 3rd and 11th — a Koorma yoga for kingship, character and renown.", "Raja", "good", [5, 6, 7].flatMap(occOf).filter(benefic));
  // Kusuma — fixed Lagna, Venus angular, Moon trinal with a benefic, Saturn in the 10th.
  if (FIXED.includes(ascSign0) && present("Venus") && KENDRA.includes(house["Venus"]) &&
      present("Moon") && trikonaHouse("Moon") && occOf(house["Moon"]).some((p) => p !== "Moon" && benefic(p)) &&
      present("Saturn") && house["Saturn"] === 10)
    add("Kusuma Yoga", "A fixed ascendant with angular Venus, a trinal Moon joined by a benefic and Saturn crowning the 10th — a Kusuma yoga for leadership, charity and lasting happiness.", "Raja", "good", ["Venus", "Moon", "Saturn"]);
  // Lagnaadhi — benefics in the 7th & 8th, free of malefics (Adhi yoga from the Lagna).
  if (houseHasBenefic(7) && houseHasBenefic(8) && !houseHasMalefic(7) && !houseHasMalefic(8))
    add("Lagnaadhi Yoga", "Benefics occupy the 7th and 8th from the Lagna, undisturbed by malefics — a Lagnaadhi yoga for accomplishment, learning and contentment.", "Raja", "good", [...occOf(7), ...occOf(8)].filter(benefic));
  // Siva — a 5th→9th→10th→5th rotation of trine and karma lords.
  if (lord5 && ninthLord && tenthLord && house[lord5] === 9 && house[ninthLord] === 10 && house[tenthLord] === 5)
    add("Siva Yoga", "The 5th, 9th and 10th lords rotate through one another's houses — a Siva yoga for wisdom, conquest and command.", "Raja", "good", [lord5, ninthLord, tenthLord]);
  // Saarada — multi-condition learning/fortune combination.
  if (tenthLord && house[tenthLord] === 5 && present("Mercury") && KENDRA.includes(house["Mercury"]) &&
      sign0["Sun"] === 4 && present("Sun") && ([5, 9].includes(fromMoon("Mercury")) || [5, 9].includes(fromMoon("Jupiter"))) &&
      present("Mars") && house["Mars"] === 11)
    add("Saarada Yoga", "The karma lord in the 5th, an angular Mercury, a strong Sun and supportive Moon-trines — a Saarada yoga for learning, wealth and a principled life.", "Auspicious", "good", ["Mercury", "Sun", "Jupiter"]);
  // Amsaavatara — Jupiter, Venus and an exalted Saturn all in angles.
  if (present("Jupiter") && KENDRA.includes(house["Jupiter"]) && present("Venus") && KENDRA.includes(house["Venus"]) &&
      present("Saturn") && KENDRA.includes(house["Saturn"]) && st("Saturn") === "Exalted")
    add("Amsaavatara Yoga", "Jupiter, Venus and an exalted Saturn all hold the angles — an Amsaavatara yoga for an exalted, learned and spotless life.", "Raja", "good", ["Jupiter", "Venus", "Saturn"]);
  // Devendra — fixed Lagna with 2nd↔10th and 1st↔11th exchanges.
  if (FIXED.includes(ascSign0) && exchLords(lord2, tenthLord) && exchLords(lagnaLord, lord11))
    add("Devendra Yoga", "A fixed ascendant with the 2nd–10th and Lagna–11th lords in mutual exchange — a Devendra yoga for leadership, charm and lasting fame.", "Raja", "good", [lord2!, tenthLord!]);
  // Indra — 5th↔11th lord exchange with the Moon in the 5th.
  if (exchLords(lord5, lord11) && present("Moon") && house["Moon"] === 5)
    add("Indra Yoga", "The 5th and 11th lords exchange while the Moon sits in the 5th — an Indra yoga for boldness, fame and long life.", "Raja", "good", [lord5!, lord11!]);
  // Ravi — Sun in the 10th, the 10th lord in the 3rd with Saturn.
  if (present("Sun") && house["Sun"] === 10 && tenthLord && house[tenthLord] === 3 && present("Saturn") && house["Saturn"] === 3)
    add("Ravi Yoga", "The Sun crowns the 10th while the karma lord joins Saturn in the 3rd — a Ravi yoga for learning, drive and recognition.", "Surya", "good", ["Sun", tenthLord]);
  // Bhaaskara — Moon 12th from Sun, Mercury 2nd from Sun, Jupiter trinal from Moon.
  if (present("Sun") && fromSun("Moon") === 12 && fromSun("Mercury") === 2 && [5, 9].includes(fromMoon("Jupiter")))
    add("Bhaaskara Yoga", "The Moon, Mercury and Jupiter array around the Sun and Moon just so — a Bhaaskara yoga for wealth, valour and wide learning.", "Surya", "good", ["Sun", "Mercury", "Jupiter"]);
  // Kulavardhana — every planet in the 5th from the Lagna, the Moon or the Sun.
  if (planets.length > 0 && planets.every((p) => house[p] === 5 || fromMoon(p) === 5 || fromSun(p) === 5))
    add("Kulavardhana Yoga", "Every planet falls in the 5th from the Lagna, the Moon or the Sun — a Kulavardhana yoga for prosperity and a thriving lineage.", "Auspicious", "good", planets);
  // Gandharva — skill-and-fame combination.
  if (tenthLord && [3, 7, 11].includes(house[tenthLord]) && lagnaLord && (assoc(lagnaLord, "Jupiter") || (present("Jupiter") && aspH("Jupiter", house["Jupiter"], house[lagnaLord]))) &&
      st("Sun") === "Exalted" && present("Moon") && house["Moon"] === 9)
    add("Gandharva Yoga", "The karma lord trinal to the 7th, a Jupiter-touched Lagna lord, an exalted Sun and the Moon in the 9th — a Gandharva yoga for renown in the fine arts.", "Auspicious", "good", ["Sun", lagnaLord]);
  // Go — moolatrikona Jupiter with the 2nd lord, and an exalted Lagna lord.
  if (st("Jupiter") === "Moolatrikona" && lord2 && house[lord2] === house["Jupiter"] && lagnaLord && st(lagnaLord) === "Exalted")
    add("Go Yoga", "A moolatrikona Jupiter joined by the 2nd lord, with an exalted Lagna lord — a Go yoga for a respectable family and wealth.", "Auspicious", "good", ["Jupiter", lord2]);
  // Vidyut — exalted 11th lord with Venus, angular to the Lagna lord.
  if (lord11 && st(lord11) === "Exalted" && house[lord11] === house["Venus"] && lagnaLord && kendraFrom(lord11, lagnaLord))
    add("Vidyut Yoga", "An exalted 11th lord conjoined with Venus, angular to the Lagna lord — a Vidyut yoga for wealth, pleasures and generosity.", "Raja", "good", [lord11, "Venus"]);
  // Chapa (exchange) — 4th↔10th lord exchange with an exalted Lagna lord.
  if (exchLords(fourthLord, tenthLord) && lagnaLord && st(lagnaLord) === "Exalted")
    add("Chapa Yoga (4th–10th)", "The 4th and 10th lords exchange while the Lagna lord is exalted — a Chapa yoga for service to power and command of wealth.", "Raja", "good", [fourthLord!, tenthLord!]);
  // Makuta — Jupiter 9th from the 9th lord, a benefic 9th from Jupiter, Saturn in the 10th.
  if (ninthLord && present("Jupiter") && house["Jupiter"] === nthFrom(house[ninthLord], 9) && houseHasBenefic(nthFrom(house["Jupiter"], 9)) && present("Saturn") && house["Saturn"] === 10)
    add("Makuta Yoga", "Jupiter nine houses from the 9th lord, a benefic nine from Jupiter and Saturn in the 10th — a Makuta yoga for powerful leadership.", "Raja", "good", ["Jupiter", "Saturn"]);
  // Jaya — exalted 10th lord with a debilitated 6th lord.
  if (tenthLord && st(tenthLord) === "Exalted" && lord6 && st(lord6) === "Debilitated")
    add("Jaya Yoga", "An exalted karma lord over a debilitated 6th lord — a Jaya yoga for success, victory over rivals and long life.", "Raja", "good", [tenthLord]);

  // ── 7d. Raja-Sambandha yogas (§11.8) — association with power, via the chara
  //  karakas (Amatyakaraka AmK, Atmakaraka AK) and the Arudha Lagna. ──
  const amk = amatyakaraka, ak = atmakaraka;
  const DIG3 = ["Own", "Exalted", "Moolatrikona"];
  const relKT = (a: string, b: string) => present(a) && present(b) && kendraTrikona(((house[a] - house[b] + 12) % 12) + 1);
  const occBySign = (s: number) => ALL9.filter((p) => present(p) && sign0[p] === s);
  const malInSign = (s: number) => occBySign(s).some((p) => !benefic(p));
  const malInHouse = (h: number) => occOf(h).some((p) => !benefic(p));

  if (tenthLord && present(amk) && tenthLord !== amk && assoc(tenthLord, amk))
    add("Raja-Sambandha (career & AmK)", `The 10th lord and the Amatyakaraka (${amk}) are ${how(tenthLord, amk)} — a place within the circle of authority.`, "RajaSambandha", "good", [tenthLord, amk]);
  if (present(ak) && present(amk) && ak !== amk && house[ak] === house[amk])
    add("Raja-Sambandha (AK–AmK)", `The Atmakaraka (${ak}) and Amatyakaraka (${amk}) are conjunct — sharp counsel and ministerial standing.`, "RajaSambandha", "good", [ak, amk]);
  if (present(amk) && DIG3.includes(st(amk)))
    add("Raja-Sambandha (dignified AmK)", `The Amatyakaraka (${amk}) is dignified — a natural advisor or administrator to the powerful.`, "RajaSambandha", "good", [amk]);
  if (present(amk) && TRIKONA.includes(house[amk]))
    add("Raja-Sambandha (AmK in trine)", `The Amatyakaraka (${amk}) holds a trine from the Lagna — renown as a counsellor.`, "RajaSambandha", "good", [amk]);
  if (amk !== ak && relKT(amk, ak))
    add("Raja-Sambandha (AmK from AK)", `The Amatyakaraka (${amk}) sits in an angle or trine from the Atmakaraka (${ak}) — a trusted associate of the powerful.`, "RajaSambandha", "good", [amk, ak]);
  if (present(ak) && DIG3.includes(st(ak)) && kendraTrikona(house[ak]) && ninthLord && assoc(ninthLord, ak))
    add("Raja-Sambandha (AK & 9th lord)", `A dignified Atmakaraka (${ak}) in an angle/trine linked to the 9th lord — ministerial fortune.`, "RajaSambandha", "good", [ak, ninthLord]);
  if (present(ak) && [5, 7, 9, 10].includes(house[ak]) && occOf(house[ak]).some((p) => p !== ak && benefic(p)))
    add("Raja-Sambandha (AK with benefic)", `The Atmakaraka (${ak}) holds a strong house alongside a benefic — gains through association with rulers.`, "RajaSambandha", "good", [ak]);
  if (present(ak) && house[ak] === 9)
    add("Raja-Sambandha (AK in 9th)", `The Atmakaraka (${ak}) occupies the 9th of fortune — luck and the friendship of the great.`, "RajaSambandha", "good", [ak]);
  if (lagnaLord && tenthLord && house[lagnaLord] === 10 && house[tenthLord] === 1)
    add("Raja-Sambandha (1st–10th exchange)", "The Lagna and 10th lords exchange signs — power and close association with authority.", "RajaSambandha", "good", [lagnaLord, tenthLord]);
  if (present(ak) && present("Moon") && present("Venus")) {
    const h4 = nthFrom(house[ak], 4);
    if (house["Moon"] === h4 && house["Venus"] === h4)
      add("Raja-Sambandha (royal insignia)", "Moon and Venus occupy the 4th from the Atmakaraka — the trappings and insignia of high office.", "RajaSambandha", "good", ["Moon", "Venus"]);
  }
  if (lord5 && kendraTrikona(house[lord5]) && ((lagnaLord && assoc(lagnaLord, lord5)) || (present(ak) && assoc(ak, lord5))))
    add("Raja-Sambandha (5th-lord union)", "The 5th lord joins the Lagna lord or Atmakaraka in an angle/trine — friendship with the powerful.", "RajaSambandha", "good", [lord5]);
  if (present(ak) && present("Moon") && ak === RL[sign0["Moon"]] && house[ak] === 1 && occOf(1).some((p) => p !== ak && benefic(p)))
    add("Raja-Sambandha (AK rises with benefic)", `The Atmakaraka (${ak}), also the Moon's dispositor, rises in the Lagna with a benefic — high office attained with maturity.`, "RajaSambandha", "good", [ak]);
  if (malInHouse(3) && malInHouse(6) && arudhaSign0 >= 0 && malInSign((arudhaSign0 + 2) % 12) && malInSign((arudhaSign0 + 5) % 12) && present(ak) && malInHouse(nthFrom(house[ak], 3)) && malInHouse(nthFrom(house[ak], 6)))
    add("Raja-Sambandha (commander)", "Malefics fill the 3rd and 6th from the Lagna, the Arudha and the Atmakaraka — the makings of a powerful commander of forces.", "RajaSambandha", "good");

  // ── 8. Arishta / affliction yogas (no strength grade — tone conveys the meaning) ──
  // Papa Kartari — the Lagna hemmed in by malefics in the 2nd & 12th.
  if (houseHasMalefic(2) && !houseHasBenefic(2) && houseHasMalefic(12) && !houseHasBenefic(12))
    add("Papa Kartari Yoga", "Malefics hem in the Lagna (2nd and 12th) — a papa-kartari enclosure that constrains the self and confidence until consciously eased.", "Affliction", "bad");
  if (assoc("Jupiter", "Rahu")) add("Guru-Chandala Yoga", `Jupiter and Rahu are ${how("Jupiter", "Rahu")} — a Guru-Chandala yoga that can unsettle faith, ethics and judgement until matured.`, "Affliction", "bad");
  if (assoc("Mars", "Rahu")) add("Angarak Yoga", `Mars and Rahu are ${how("Mars", "Rahu")} — an Angaraka yoga that spikes anger and impulsiveness; channel it into disciplined action.`, "Affliction", "bad");
  if (assoc("Moon", "Saturn")) add("Vish Yoga", `Moon and Saturn are ${how("Moon", "Saturn")} — a Vish yoga that can bring melancholy and delay; routine and patience dissolve it.`, "Affliction", "bad");
  if (assoc("Saturn", "Rahu")) add("Shrapit Yoga", `Saturn and Rahu are ${how("Saturn", "Rahu")} — a Shrapit yoga indicating karmic backlog that rewards steady, ethical effort.`, "Affliction", "bad");
  for (const lum of ["Sun", "Moon"]) for (const node of ["Rahu", "Ketu"])
    if (present(lum) && present(node) && house[lum] === house[node])
      add(`Grahana Yoga (${lum}–${node})`, `${lum} is conjunct ${node} — a Grahana (eclipse) yoga that veils ${lum === "Sun" ? "confidence and father-significations" : "emotional clarity and mother-significations"} until worked through.`, "Affliction", "bad");
  const eleventhLord = owner(11);
  if (eleventhLord && DUSTHANA.includes(house[eleventhLord]))
    add("Daridra Yoga", `The 11th lord ${eleventhLord} (gains) falls in a dusthana — a Daridra yoga that can block easy income; disciplined saving counters it.`, "Affliction", "bad");

  // Daridra (poverty) combinations (Parasara): a dusthana/maraka grip on the
  // wealth-giving houses. Maraka = the 2nd & 7th lords (killers of prosperity).
  const sixthLord = owner(6), twelfthLord = owner(12);
  const marakas = [lord2, lord7].filter(Boolean) as string[];
  const grippedByMaraka = (h: number) => marakas.some((m) => present(m) && (house[m] === h || aspH(m, house[m], h)));
  // (1) Lagna lord in 12th and 12th lord in the Lagna, with a maraka grip.
  if (lagnaLord && twelfthLord && house[lagnaLord] === 12 && house[twelfthLord] === 1 && grippedByMaraka(12))
    add("Daridra Yoga (1st–12th)", "The Lagna lord and 12th lord exchange under a maraka's grip — a Daridra combination draining resources; effort and care reverse it.", "Affliction", "bad");
  // (2) Lagna lord in 6th and 6th lord in the Lagna, with a maraka grip.
  if (lagnaLord && sixthLord && house[lagnaLord] === 6 && house[sixthLord] === 1 && grippedByMaraka(6))
    add("Daridra Yoga (1st–6th)", "The Lagna lord and 6th lord exchange under a maraka's grip — a Daridra combination of debt and drain that disciplined service can outgrow.", "Affliction", "bad");
  // (3) Lagna lord with a malefic in a dusthana while the 2nd lord is debilitated/inimical.
  if (lagnaLord && DUSTHANA.includes(house[lagnaLord]) && occOf(house[lagnaLord]).some((p) => p !== lagnaLord && !benefic(p)) &&
      lord2 && ["Debilitated", "Enemy", "Great Enemy"].includes(st(lord2)))
    add("Daridra Yoga (afflicted Lagna lord)", "The Lagna lord sits with a malefic in a dusthana while the 2nd lord is weak — a Daridra combination that holds back wealth until the chart's strengths are deliberately built.", "Affliction", "bad");
  // (4) 5th lord in the 6th and 9th lord in the 12th, with a maraka grip.
  if (lord5 && ninthLord && house[lord5] === 6 && house[ninthLord] === 12 && (grippedByMaraka(6) || grippedByMaraka(12)))
    add("Daridra Yoga (fallen trine lords)", "The 5th and 9th (trine) lords fall into dusthanas under a maraka's grip — a Daridra combination that asks for patience before fortune turns.", "Affliction", "bad");
  // (5) Mars and Saturn conjunct in the 2nd, unaspected by Mercury.
  if (present("Mars") && present("Saturn") && house["Mars"] === 2 && house["Saturn"] === 2 &&
      !(present("Mercury") && (house["Mercury"] === 2 || aspH("Mercury", house["Mercury"], 2))))
    add("Daridra Yoga (Mars–Saturn in 2nd)", "Mars and Saturn sit in the 2nd (wealth/speech) without Mercury's relief — a Daridra combination; Mercury's involvement would instead generate wealth.", "Affliction", "bad");
  // (6) Sun in the 2nd aspected by Saturn.
  if (present("Sun") && house["Sun"] === 2 && present("Saturn") && aspH("Saturn", house["Saturn"], 2))
    add("Daridra Yoga (Sun in 2nd)", "The Sun in the 2nd under Saturn's aspect — a Daridra combination constraining early finances; an un-aspected Sun here would instead give wealth.", "Affliction", "bad");
  if (present("Moon") && present("Jupiter") && [6, 8].includes(((sign0["Moon"] - sign0["Jupiter"] + 12) % 12) + 1))
    add("Shakata Yoga", "The Moon falls in the 6th/8th from Jupiter — a Shakata yoga of fluctuating fortune; eased when the Moon is angular from the Lagna.", "Affliction", "bad");

  // ── 9. Nabhasa yogas (structural; whole-chart patterns, left ungraded) ──
  // Asraya — all seven in one modality.
  const everySign = (set: number[]) => planets.length > 0 && planets.every((p) => set.includes(sign0[p]));
  if (everySign(MOVABLE)) add("Rajju Yoga", "All planets fall in movable signs — a Rajju Nabhasa yoga: love of travel and changeful fortunes.", "Nabhasa", "neutral");
  if (everySign(FIXED)) add("Musala Yoga", "All planets fall in fixed signs — a Musala Nabhasa yoga: stability, resolve and wealth.", "Nabhasa");
  if (everySign(DUAL)) add("Nala Yoga", "All planets fall in dual signs — a Nala Nabhasa yoga: adaptability and skill with detail.", "Nabhasa", "neutral");

  // Dala — benefics vs malefics holding the angles.
  const benefics7 = planets.filter(benefic);
  const malefics7 = planets.filter((p) => !benefic(p));
  const inKendra = (p: string) => KENDRA.includes(house[p]);
  if (benefics7.length && benefics7.every(inKendra) && malefics7.every((p) => !inKendra(p)))
    add("Mala (Srak) Yoga", "Benefics hold the angles while malefics stay clear — a Mala Nabhasa yoga for comforts, pleasures and steady happiness.", "Nabhasa");
  if (malefics7.length && malefics7.every(inKendra) && benefics7.every((p) => !inKendra(p)))
    add("Sarpa Yoga", "Malefics hold the angles — a Sarpa Nabhasa yoga that brings early hardship and demands grit.", "Nabhasa", "bad");

  // Akriti — shape of the chart by occupied houses (first containment match wins).
  const occH = [...new Set(planets.map((p) => house[p]))];
  const within = (hs: number[]) => occH.length > 0 && occH.every((h) => hs.includes(h));
  const both = (a: number, b: number) => within([a, b]) && occH.includes(a) && occH.includes(b);
  const allKendra = planets.length > 0 && planets.every(inKendra);
  if (within([1, 5, 9]) && [1, 5, 9].some((h) => occH.includes(h)))
    add("Shringataka Yoga", "All planets occupy the trines (1/5/9) — a Shringataka Nabhasa yoga for happiness, fortune and a loving nature.", "Nabhasa");
  else if (allKendra && benefics7.length && malefics7.length && benefics7.every((p) => [1, 7].includes(house[p])) && malefics7.every((p) => [4, 10].includes(house[p])))
    add("Vajra Yoga", "Benefics hold the 1st/7th and malefics the 4th/10th — a Vajra Nabhasa yoga: happy at the start and end of life.", "Nabhasa");
  else if (allKendra && benefics7.length && malefics7.length && malefics7.every((p) => [1, 7].includes(house[p])) && benefics7.every((p) => [4, 10].includes(house[p])))
    add("Yava Yoga", "Malefics hold the 1st/7th and benefics the 4th/10th — a Yava Nabhasa yoga: comfortable through the middle of life.", "Nabhasa");
  else if (allKendra) add("Kamala Yoga", "All planets occupy the four angles — a Kamala Nabhasa yoga for fame, virtue and abundant fortune.", "Nabhasa");
  else if ([[1, 4], [4, 7], [7, 10], [10, 1]].some(([a, b]) => both(a, b)))
    add("Gada Yoga", "All planets occupy two adjacent angles — a Gada Nabhasa yoga for wealth through effort and merit.", "Nabhasa");
  else if (both(1, 7)) add("Shakata (Nabhasa) Yoga", "All planets occupy the 1st and 7th — a Shakata Nabhasa yoga of fluctuating fortunes.", "Nabhasa", "neutral");
  else if (both(4, 10)) add("Vihaga Yoga", "All planets occupy the 4th and 10th — a Vihaga Nabhasa yoga giving a roving, enterprising life.", "Nabhasa", "neutral");
  else if (within([2, 6, 10]) || within([3, 7, 11]) || within([4, 8, 12]))
    add("Hala Yoga", "All planets occupy one set of non-1/5/9 trines — a Hala Nabhasa yoga for a life of labour, land or service.", "Nabhasa", "neutral");
  else if (within(span(1, 4))) add("Yupa Yoga", "All planets fall within the 1st–4th houses — a Yupa Nabhasa yoga inclined to ritual, duty and family.", "Nabhasa", "neutral");
  else if (within(span(4, 4))) add("Shara (Ishu) Yoga", "All planets fall within the 4th–7th houses — a Shara Nabhasa yoga linked to making and sharp skills.", "Nabhasa", "neutral");
  else if (within(span(7, 4))) add("Shakti Yoga", "All planets fall within the 7th–10th houses — a Shakti Nabhasa yoga giving endurance through early struggle.", "Nabhasa", "neutral");
  else if (within(span(10, 4))) add("Danda Yoga", "All planets fall within the 10th–1st houses — a Danda Nabhasa yoga that asks for self-reliance.", "Nabhasa", "neutral");
  else if (within([2, 5, 8, 11]) || within([3, 6, 9, 12]))
    add("Vapi Yoga", "All planets avoid the angles (succedent/cadent houses) — a Vapi Nabhasa yoga for steady accumulation of wealth.", "Nabhasa");
  else if (within(span(1, 7))) add("Nauka Yoga", "All planets fall within seven houses from the Lagna — a Nauka Nabhasa yoga: wealth earned by one's own effort.", "Nabhasa");
  else if (within(span(4, 7))) add("Koota Yoga", "All planets fall within the 4th–10th houses — a Koota Nabhasa yoga of a guarded, self-made life.", "Nabhasa", "neutral");
  else if (within(span(7, 7))) add("Chhatra Yoga", "All planets fall within the 7th–1st houses — a Chhatra Nabhasa yoga giving support and favour from others.", "Nabhasa");
  else if (within(span(10, 7))) add("Chaapa Yoga", "All planets fall within the 10th–4th houses — a Chaapa (Dhanus) Nabhasa yoga of an adventurous, independent life.", "Nabhasa", "neutral");
  else if ([2, 3, 5, 6, 8, 9, 11, 12].some((s) => within(span(s, 7))))
    add("Ardha-Chandra Yoga", "All planets fall within seven houses starting from a non-angle — an Ardha-Chandra Nabhasa yoga for charm, strength and command.", "Nabhasa");
  if (occH.length && occH.every((h) => h % 2 === 1)) add("Chakra Yoga", "All planets occupy odd houses — a Chakra Nabhasa yoga of sovereignty and influence.", "Nabhasa");
  else if (occH.length && occH.every((h) => h % 2 === 0)) add("Samudra Yoga", "All planets occupy even houses — a Samudra Nabhasa yoga for wealth and many comforts.", "Nabhasa");

  // Sankhya — distinct signs occupied by the seven. Per §11.5.4 these apply ONLY when
  // no other (Asraya/Dala/Akriti) Nabhasa yoga is present, and are the least important.
  if (planets.length === 7 && !out.some((y) => y.category === "Nabhasa")) {
    const occSigns = new Set(planets.map((p) => sign0[p]));
    const SANKHYA: Record<number, string> = { 1: "Gola", 2: "Yuga", 3: "Shoola", 4: "Kedara", 5: "Pasha", 6: "Damini", 7: "Veena" };
    if (SANKHYA[occSigns.size])
      add(`${SANKHYA[occSigns.size]} Yoga`, `The seven planets occupy ${occSigns.size} sign${occSigns.size > 1 ? "s" : ""} — the ${SANKHYA[occSigns.size]} (Sankhya) Nabhasa yoga shaping the chart's overall spread.`, "Nabhasa", "neutral");
  }

  // De-duplicate by name (keep the first, which carries its strength).
  const seen = new Set<string>();
  return out.filter((y) => (seen.has(y.name) ? false : (seen.add(y.name), true)));
}
