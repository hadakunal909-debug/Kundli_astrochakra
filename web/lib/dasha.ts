import type { KundliResponse } from "./types";

// Vimshottari sequence and durations (years), total 120.
export const VIM_ORDER = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];
export const VIM_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

export interface Period {
  planet: string;
  start: Date;
  end: Date;
}

type MahaInput = { planet: string; startTime: string | Date; endTime: string | Date };

/**
 * Sub-periods of any dasha period (works at every level — antar within maha,
 * pratyantar within antar, sookshma within pratyantar, prana within sookshma).
 * They run in Vimshottari order starting from the parent's lord, each
 * proportional to its Vimshottari years. This proportional method is exact at
 * any depth, so deeper levels are derived on demand without a precomputed tree.
 */
export function subPeriodsOf(planet: string, startMs: number, endMs: number): Period[] {
  const span = endMs - startMs;
  const startIdx = VIM_ORDER.indexOf(planet);
  const out: Period[] = [];
  let t = startMs;
  for (let i = 0; i < 9; i++) {
    const p = VIM_ORDER[(startIdx + i) % 9];
    const d = span * (VIM_YEARS[p] / 120);
    out.push({ planet: p, start: new Date(t), end: new Date(t + d) });
    t += d;
  }
  return out;
}

/** Antardashas (level-2 sub-periods) of a mahadasha. */
export function antardashasOf(maha: MahaInput): Period[] {
  return subPeriodsOf(
    maha.planet,
    new Date(maha.startTime).getTime(),
    new Date(maha.endTime).getTime(),
  );
}

export interface CurrentDasha {
  maha: Period | null;
  antar: Period | null;
}

/** The mahadasha + antardasha running at `nowMs` (defaults to current time). */
export function currentDasha(
  data: KundliResponse,
  nowMs = Date.now(),
): CurrentDasha {
  const md = data.kundli.dasha.mahadashas;
  const maha = md.find((m) => {
    const s = new Date(m.startTime).getTime();
    const e = new Date(m.endTime).getTime();
    return nowMs >= s && nowMs < e;
  });
  if (!maha) return { maha: null, antar: null };
  const mahaPeriod: Period = {
    planet: maha.planet,
    start: new Date(maha.startTime),
    end: new Date(maha.endTime),
  };
  const antar =
    antardashasOf(maha).find(
      (a) => nowMs >= a.start.getTime() && nowMs < a.end.getTime(),
    ) ?? null;
  return { maha: mahaPeriod, antar };
}
