import { Observer, Body } from "astronomy-engine";
import { getSunrise, getSunset, getUdayaLagna, getPlanetaryPosition } from "../core/calculations";
import { getAyanamsa } from "../core/ayanamsa";
import { rashiNames } from "../core/constants";
import { RASHI_LORDS } from "../matching/constants";

/**
 * Special lagnas (special ascendants), Bhrigu Bindu, and the upagrahas
 * (shadowy sub-planets). Computed per the classical definitions used in
 * P.V.R. Narasimha Rao's "Vedic Astrology: An Integrated Approach" / Jagannatha
 * Hora. Several of these points have convention variants between authors — the
 * choices made here are noted in comments so they can be validated against the
 * reference text.
 */

export interface SpecialPoint {
  name: string;
  abbr: string;
  category: "lagna" | "upagraha";
  rashi: number; // 1 = Aries … 12 = Pisces
  rashiName: string;
  longitude?: number; // present when the point has a precise longitude
  degree?: number; // whole-ish degrees within the sign (when longitude known)
  note: string;
}

export interface SpecialLagnasResult {
  lagnas: SpecialPoint[];
  upagrahas: SpecialPoint[];
}

const norm = (x: number): number => ((x % 360) + 360) % 360;

/** Build a point that has a real longitude (sign + degree). */
function lonPoint(
  name: string,
  abbr: string,
  category: SpecialPoint["category"],
  longitude: number,
  note: string,
): SpecialPoint {
  const l = norm(longitude);
  const r0 = Math.floor(l / 30);
  return {
    name,
    abbr,
    category,
    longitude: l,
    rashi: r0 + 1,
    rashiName: rashiNames[r0],
    degree: l - r0 * 30,
    note,
  };
}

/** Build a sign-only point (e.g. Indu/Varnada — classically a rasi, no longitude). */
function signPoint(
  name: string,
  abbr: string,
  category: SpecialPoint["category"],
  rashi0: number,
  note: string,
): SpecialPoint {
  const r0 = ((rashi0 % 12) + 12) % 12;
  return { name, abbr, category, rashi: r0 + 1, rashiName: rashiNames[r0], note };
}

// Lords of the weekdays, Sunday→Saturday — also the order in which the eight
// parts of the day/night are ruled.
const WEEKDAY_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** Local weekday (0=Sun…6=Sat) at the location, from a UTC instant via a
 *  longitude-based offset (accurate enough for the vara, which is read at sunrise). */
function localWeekday(instant: Date, lonDeg: number): number {
  return new Date(instant.getTime() + (lonDeg / 15) * 3600_000).getUTCDay();
}

/**
 * Compute the special lagnas and upagrahas for a birth.
 * @param date Birth instant (UTC).
 * @param observer Birth location.
 * @param planets Sidereal planet longitudes (needs Sun, Moon, Rahu).
 * @param lagnaLon Sidereal ascendant longitude (D1).
 */
export function getSpecialLagnas(
  date: Date,
  observer: Observer,
  planets: Record<string, { longitude: number }>,
  lagnaLon: number,
): SpecialLagnasResult {
  const lagnas: SpecialPoint[] = [];
  const upagrahas: SpecialPoint[] = [];

  const sun = planets["Sun"]?.longitude ?? 0;
  const moon = planets["Moon"]?.longitude ?? 0;
  const rahu = planets["Rahu"]?.longitude ?? 0;

  // ── Points that need no sunrise ──────────────────────────────────────────
  // Sree Lagna = Ascendant + (Moon's fraction through its nakshatra) × 360°.
  const nakLen = 40 / 3; // 13°20′
  const moonNakFrac = (((moon % nakLen) + nakLen) % nakLen) / nakLen;
  lagnas.push(
    lonPoint("Sree Lagna", "SL", "lagna", lagnaLon + moonNakFrac * 360,
      "Prosperity, fortune and the flow of wealth (Lakshmi)."),
  );

  // Indu Lagna (sign only): kalas of the 9th lord from Lagna + 9th lord from Moon,
  // reduced mod 12, counted from the Moon.
  const KALA: Record<string, number> = {
    Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1,
  };
  const lagnaSign0 = Math.floor(norm(lagnaLon) / 30);
  const moonSign0 = Math.floor(norm(moon) / 30);
  const ninthLord = (sign0: number) => RASHI_LORDS[(sign0 + 8) % 12];
  const kalaSum = (KALA[ninthLord(lagnaSign0)] ?? 0) + (KALA[ninthLord(moonSign0)] ?? 0);
  let induSteps = kalaSum % 12;
  if (induSteps === 0) induSteps = 12;
  lagnas.push(
    signPoint("Indu Lagna", "IL", "lagna", (moonSign0 + induSteps - 1) % 12,
      "Wealth potential and the financial promise of the chart."),
  );

  // Bhrigu Bindu = midpoint of the arc from Rahu forward to the Moon.
  const bb = norm(rahu + norm(moon - rahu) / 2);
  lagnas.push(
    lonPoint("Bhrigu Bindu", "BB", "lagna", bb,
      "A sensitive destiny point (Moon–Rahu midpoint) marking turning-points."),
  );

  // Sun-derived upagrahas (fixed longitude offsets from the natal Sun).
  const dhuma = norm(sun + 133 + 20 / 60);
  const vyatipata = norm(360 - dhuma);
  const parivesha = norm(vyatipata + 180);
  const indrachapa = norm(360 - parivesha);
  const upaketu = norm(indrachapa + 16 + 40 / 60);
  upagrahas.push(lonPoint("Dhuma", "Dh", "upagraha", dhuma, "Smoke — a harsh, fiery solar point."));
  upagrahas.push(lonPoint("Vyatipata", "Vy", "upagraha", vyatipata, "A node-like point of calamity and upheaval."));
  upagrahas.push(lonPoint("Parivesha", "Pv", "upagraha", parivesha, "Halo — a point of dazzle and confusion."));
  upagrahas.push(lonPoint("Indrachapa", "Ic", "upagraha", indrachapa, "Rainbow — a point of fleeting brilliance."));
  upagrahas.push(lonPoint("Upaketu", "Uk", "upagraha", upaketu, "Comet — a point of sudden, unexpected change."));

  // ── Time-from-sunrise points ─────────────────────────────────────────────
  const sunriseToday = getSunrise(date, observer);
  const sunsetToday = getSunset(date, observer);
  const dayMs = 86_400_000;

  // Reference sunrise = the most recent sunrise at or before birth.
  let refSunrise: Date | null = sunriseToday;
  if (!sunriseToday || date < sunriseToday) {
    refSunrise = getSunrise(new Date(date.getTime() - dayMs), observer);
  }

  let horaLagnaSign0: number | null = null;

  if (refSunrise) {
    const hours = (date.getTime() - refSunrise.getTime()) / 3600_000;
    const seconds = (date.getTime() - refSunrise.getTime()) / 1000;
    const sunAtSunrise = getPlanetaryPosition(Body.Sun, refSunrise, getAyanamsa(refSunrise)).longitude;

    // Bhava (1 rasi / 5 ghatis = 15°/hr), Hora (1 rasi / 2.5 ghatis = 30°/hr),
    // Ghati (1 rasi / 1 ghati = 75°/hr) — all from the Sun's sunrise longitude.
    const bhava = norm(sunAtSunrise + 15 * hours);
    const hora = norm(sunAtSunrise + 30 * hours);
    const ghati = norm(sunAtSunrise + 75 * hours);
    horaLagnaSign0 = Math.floor(hora / 30);

    lagnas.push(lonPoint("Bhava Lagna", "BL", "lagna", bhava, "The body and its day-to-day condition."));
    lagnas.push(lonPoint("Hora Lagna", "HL", "lagna", hora, "Wealth, earnings and financial flow."));
    lagnas.push(lonPoint("Ghati Lagna", "GL", "lagna", ghati, "Power, authority and worldly status."));

    // Pranapada: offset° = seconds-since-sunrise ÷ 12, added to the Sun's sunrise
    // longitude; then +0/+120/+240 if the natal Sun is in a movable/dual/fixed sign.
    const ppBase = sunAtSunrise + seconds / 12;
    const sunType = Math.floor(norm(sun) / 30) % 3; // 0 movable, 1 fixed, 2 dual
    const ppAdd = sunType === 0 ? 0 : sunType === 1 ? 240 : 120;
    lagnas.push(lonPoint("Pranapada Lagna", "PP", "lagna", ppBase + ppAdd,
      "Vitality and the life-force animating the body."));
  }

  // Varnada Lagna (sign only) — needs the Hora Lagna sign.
  if (horaLagnaSign0 !== null) {
    // count(sign0): odd sign → forward from Aries; even sign → reverse from Pisces.
    const countOf = (sign0: number) => {
      const num = sign0 + 1; // 1 = Aries
      return num % 2 === 1 ? num : 13 - num;
    };
    const L = countOf(lagnaSign0);
    const H = countOf(horaLagnaSign0);
    const V = (L % 2) === (H % 2) ? L + H : Math.abs(L - H);
    // V odd → count from Aries forward; V even → from Pisces in reverse.
    const varnada0 = V % 2 === 1 ? (V - 1) % 12 : ((12 - V) % 12 + 12) % 12;
    lagnas.push(signPoint("Varnada Lagna", "VL", "lagna", varnada0,
      "Social role and the karmic duty one is born to."));
  }

  // ── Kaala-vela upagrahas (ascendant rising at a planet's 1/8 part) ────────
  // Day = sunrise→sunset in 8 parts ruled from the weekday lord; night =
  // sunset→next-sunrise in 8 parts ruled from the lord of the 5th weekday.
  if (sunriseToday && sunsetToday) {
    const isDay = date >= sunriseToday && date < sunsetToday;
    let segStart: Date | null = null;
    let segLen = 0;
    let startLordIdx = 0;

    if (isDay) {
      segStart = sunriseToday;
      segLen = (sunsetToday.getTime() - sunriseToday.getTime()) / 8;
      startLordIdx = localWeekday(sunriseToday, observer.longitude);
    } else if (date >= sunsetToday) {
      const nextSunrise = getSunrise(new Date(date.getTime() + dayMs), observer);
      if (nextSunrise) {
        segStart = sunsetToday;
        segLen = (nextSunrise.getTime() - sunsetToday.getTime()) / 8;
        startLordIdx = (localWeekday(sunriseToday, observer.longitude) + 4) % 7;
      }
    } else {
      // pre-dawn: night that began at the previous sunset
      const prevSunset = getSunset(new Date(date.getTime() - dayMs), observer);
      const prevSunrise = getSunrise(new Date(date.getTime() - dayMs), observer);
      if (prevSunset && prevSunrise) {
        segStart = prevSunset;
        segLen = (sunriseToday.getTime() - prevSunset.getTime()) / 8;
        startLordIdx = (localWeekday(prevSunrise, observer.longitude) + 4) % 7;
      }
    }

    if (segStart && segLen > 0) {
      const ascAt = (t: number) => {
        const d = new Date(t);
        return getUdayaLagna(d, observer, getAyanamsa(d));
      };
      const partIndex = (planet: string) =>
        (WEEKDAY_LORDS.indexOf(planet) - startLordIdx + 7) % 7; // 0..6

      const VELA: { name: string; abbr: string; planet: string; note: string }[] = [
        { name: "Kaala", abbr: "Kl", planet: "Sun", note: "Solar shadow — a sensitive malefic point." },
        { name: "Mrityu", abbr: "Mr", planet: "Mars", note: "Martian shadow tied to crises and endings." },
        { name: "Ardhaprahara", abbr: "Ap", planet: "Mercury", note: "Mercurial shadow point." },
        { name: "Yamaghantaka", abbr: "Yg", planet: "Jupiter", note: "Jupiterian shadow point." },
        { name: "Gulika", abbr: "Gk", planet: "Saturn", note: "Saturn's shadow — the strongest malefic sub-point; afflicts what it touches." },
      ];
      for (const v of VELA) {
        const start = segStart.getTime() + partIndex(v.planet) * segLen;
        upagrahas.push(lonPoint(v.name, v.abbr, "upagraha", ascAt(start), v.note));
      }
      // Maandi: ascendant at the MIDDLE of Saturn's part. (Convention varies between
      // authors — Gulika at the start, Maandi at the middle, is the common distinction.)
      const maandiTime = segStart.getTime() + (partIndex("Saturn") + 0.5) * segLen;
      upagrahas.push(lonPoint("Maandi", "Md", "upagraha", ascAt(maandiTime),
        "Companion malefic point to Gulika (middle of Saturn's part)."));
    }
  }

  return { lagnas, upagrahas };
}
