import React from "react";
import type { ChartData } from "@/lib/jyotish-ui";
import PlanetGlyphEl from "./PlanetGlyphEl";

// North-Indian chart on a 400×400 grid. House positions are FIXED; house 1 is the
// top-centre rhombus and holds the Lagna. Each cell is labelled with the sign
// (rashi) number occupying it, counting from the ascendant.

// Rashi-number label positions. Each sits just inside its own house, near the
// house's inner vertex. The four rhombus houses (1,4,7,10) cluster around the
// centre; the eight triangle houses sit by the diagonal/diamond intersection
// points P_LT(100,100), P_TR(300,100), P_RB(300,300), P_BL(100,300).
const NUM_POS: Record<number, [number, number]> = {
  1: [200, 172], 4: [172, 200], 7: [200, 228], 10: [228, 200],
  2: [100, 78], 12: [300, 78],
  3: [78, 100], 11: [322, 100],
  5: [78, 300], 9: [322, 300],
  6: [100, 322], 8: [300, 322],
};

// Planet-cluster anchor (centre) per house.
const PLN_POS: Record<number, [number, number]> = {
  1: [200, 72], 2: [100, 36], 3: [40, 100], 4: [74, 200],
  5: [40, 300], 6: [100, 364], 7: [200, 328], 8: [300, 364],
  9: [360, 300], 10: [326, 200], 11: [360, 100], 12: [300, 36],
};

const LINE = "#e6a85c"; // dashed orange
const NUM_COLOR = "#868e96";

// Polygon outline of each of the 12 houses on the 400×400 grid (for click + highlight).
const HOUSE_POLY: Record<number, string> = {
  1: "200,0 300,100 200,200 100,100",
  2: "0,0 200,0 100,100",
  3: "0,0 100,100 0,200",
  4: "0,200 100,100 200,200 100,300",
  5: "0,400 0,200 100,300",
  6: "0,400 100,300 200,400",
  7: "200,400 100,300 200,200 300,300",
  8: "400,400 200,400 300,300",
  9: "400,400 300,300 400,200",
  10: "400,200 300,300 200,200 300,100",
  11: "400,0 400,200 300,100",
  12: "400,0 300,100 200,0",
};

export default function NorthChart({
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
  const rashiAt = (house: number) => ((data.ascRashi - 1 + (house - 1)) % 12) + 1;

  // Lay planets of a house into rows of up to 3, centred on the anchor.
  const planetEls: React.ReactNode[] = [];
  for (let h = 1; h <= 12; h++) {
    const list = data.houses[h] ?? [];
    if (!list.length) continue;
    const [ax, ay] = PLN_POS[h];
    const perRow = Math.min(list.length, 3);
    const rows = Math.ceil(list.length / 3);
    list.forEach((g, i) => {
      const row = Math.floor(i / 3);
      const colsThisRow = Math.min(3, list.length - row * 3);
      const col = i % 3;
      const x = ax + (col - (colsThisRow - 1) / 2) * 26;
      const y = ay + (row - (rows - 1) / 2) * 25;
      planetEls.push(
        <PlanetGlyphEl key={`${h}-${i}`} glyph={g} x={x} y={y} />,
      );
    });
  }

  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{title}</figcaption>
      <svg viewBox="0 0 400 400" className="north-chart" role="img" aria-label={title}>
        {/* outer border */}
        <rect x={1} y={1} width={398} height={398} fill="#fffdf7" stroke="#d9c39a" strokeWidth={1.5} />
        {/* selected-house highlight (behind lines & planets) */}
        {selectedHouse && HOUSE_POLY[selectedHouse] && (
          <polygon points={HOUSE_POLY[selectedHouse]} fill="rgba(224,118,15,0.14)" />
        )}
        {/* inner lines (dashed) */}
        <g stroke={LINE} strokeWidth={1} strokeDasharray="3 3" fill="none">
          <line x1={0} y1={0} x2={400} y2={400} />
          <line x1={400} y1={0} x2={0} y2={400} />
          <line x1={200} y1={0} x2={400} y2={200} />
          <line x1={400} y1={200} x2={200} y2={400} />
          <line x1={200} y1={400} x2={0} y2={200} />
          <line x1={0} y1={200} x2={200} y2={0} />
        </g>
        {/* rashi numbers */}
        {Object.entries(NUM_POS).map(([h, [nx, ny]]) => (
          <text
            key={h}
            x={nx}
            y={ny}
            textAnchor="middle"
            fontSize={11}
            fill={NUM_COLOR}
            fontFamily="'Segoe UI', system-ui, sans-serif"
          >
            {rashiAt(Number(h))}
          </text>
        ))}
        {/* planets */}
        {planetEls}
        {/* clickable house regions (on top, transparent) */}
        {onSelectHouse &&
          Object.entries(HOUSE_POLY).map(([h, pts]) => (
            <polygon
              key={`hit-${h}`}
              points={pts}
              className="house-hit"
              onClick={() => onSelectHouse(Number(h))}
            />
          ))}
      </svg>
    </figure>
  );
}
