import React from "react";
import type { ChartData } from "@/lib/jyotish-ui";
import PlanetGlyphEl from "./PlanetGlyphEl";

// South-Indian chart: a 4×4 grid where each sign sits in a FIXED cell (Pisces
// top-left, then Aries→Gemini across the top, going clockwise round the edge).
// The centre 2×2 is left blank. The Lagna sign is marked with a corner diagonal.
const CELL = 100; // px per cell on a 400×400 grid

// rashi (1=Aries … 12=Pisces) → [row, col]
const RASHI_CELL: Record<number, [number, number]> = {
  12: [0, 0], 1: [0, 1], 2: [0, 2], 3: [0, 3],
  11: [1, 0], 4: [1, 3],
  10: [2, 0], 5: [2, 3],
  9: [3, 0], 8: [3, 1], 7: [3, 2], 6: [3, 3],
};

export default function SouthChart({
  data,
  title,
  selectedHouse,
  onSelectHouse,
}: {
  data: ChartData;
  title: string;
  selectedHouse?: number;
  onSelectHouse?: (house: number) => void;
}) {
  // House number ↔ rashi (signs are fixed; houses count from the ascendant sign).
  const rashiOfHouse = (h: number) => ((data.ascRashi - 1 + (h - 1)) % 12) + 1;
  const houseOfRashi = (r: number) => ((r - data.ascRashi + 12) % 12) + 1;
  // Convert house-indexed planets to rashi-indexed (signs are fixed in S-Indian).
  const byRashi: Record<number, ChartData["houses"][number]> = {};
  for (let h = 1; h <= 12; h++) {
    const list = data.houses[h] ?? [];
    if (!list.length) continue;
    const rashi = ((data.ascRashi - 1 + (h - 1)) % 12) + 1;
    byRashi[rashi] = list;
  }

  const planetEls: React.ReactNode[] = [];
  for (let rashi = 1; rashi <= 12; rashi++) {
    const list = byRashi[rashi];
    if (!list || !list.length) continue;
    const [row, col] = RASHI_CELL[rashi];
    const cx = col * CELL + CELL / 2;
    const cy = row * CELL + CELL / 2 + 6; // nudge below the sign number
    list.forEach((g, i) => {
      const r = Math.floor(i / 2);
      const colsThisRow = Math.min(2, list.length - r * 2);
      const c = i % 2;
      const x = cx + (c - (colsThisRow - 1) / 2) * 30;
      const y = cy + (r - (Math.ceil(list.length / 2) - 1) / 2) * 26;
      planetEls.push(<PlanetGlyphEl key={`${rashi}-${i}`} glyph={g} x={x} y={y} />);
    });
  }

  const [ar, ac] = RASHI_CELL[data.ascRashi];

  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{title}</figcaption>
      <svg viewBox="0 0 400 400" className="north-chart" role="img" aria-label={title}>
        {/* outer border + grid */}
        <rect x={1} y={1} width={398} height={398} fill="#fffdf7" stroke="#d9c39a" strokeWidth={1.5} />
        {/* selected-house highlight */}
        {selectedHouse &&
          (() => {
            const [row, col] = RASHI_CELL[rashiOfHouse(selectedHouse)];
            return (
              <rect
                x={col * CELL}
                y={row * CELL}
                width={CELL}
                height={CELL}
                fill="rgba(224,118,15,0.14)"
              />
            );
          })()}
        <g stroke="#e6a85c" strokeWidth={1} fill="none">
          {[1, 2, 3].map((i) => (
            <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={400} />
          ))}
          {[1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={0} y1={i * CELL} x2={400} y2={i * CELL} />
          ))}
        </g>
        {/* blank centre block (hide the inner cross) */}
        <rect x={CELL} y={CELL} width={2 * CELL} height={2 * CELL} fill="#fffdf7" stroke="#d9c39a" strokeWidth={1} />

        {/* Lagna marker — diagonal in the ascendant cell's top-left corner */}
        <line
          x1={ac * CELL}
          y1={ar * CELL}
          x2={ac * CELL + 22}
          y2={ar * CELL + 22}
          stroke="#e0760f"
          strokeWidth={1.6}
        />

        {/* sign numbers (top-left of each outer cell) */}
        {Object.entries(RASHI_CELL).map(([rashi, [row, col]]) => (
          <text
            key={rashi}
            x={col * CELL + 8}
            y={row * CELL + 16}
            fontSize={11}
            fill="#868e96"
            fontFamily="'Segoe UI', system-ui, sans-serif"
          >
            {rashi}
          </text>
        ))}

        {planetEls}

        {/* clickable cells (on top, transparent) */}
        {onSelectHouse &&
          Object.entries(RASHI_CELL).map(([rashi, [row, col]]) => (
            <rect
              key={`hit-${rashi}`}
              x={col * CELL}
              y={row * CELL}
              width={CELL}
              height={CELL}
              className="house-hit"
              onClick={() => onSelectHouse(houseOfRashi(Number(rashi)))}
            />
          ))}
      </svg>
    </figure>
  );
}
