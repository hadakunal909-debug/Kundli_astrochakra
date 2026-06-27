import React from "react";
import type { PlanetGlyph } from "@/lib/jyotish-ui";

export const ICON = 14; // px, planet glyph icon size

/**
 * A single planet inside a chart cell: the generated glyph icon with its
 * short-hand name (Su, Mo, Ma…) stacked underneath. The degree (D1) and a
 * retrograde marker ride on the name line. Outer planets (no icon) fall back
 * to just the coloured name.
 */
export default function PlanetGlyphEl({
  glyph,
  x,
  y,
}: {
  glyph: PlanetGlyph;
  x: number;
  y: number;
}) {
  const hasDeg = glyph.degree !== undefined;

  const label = (
    <text
      x={x}
      y={glyph.icon ? y + 9 : y + 4}
      textAnchor="middle"
      fontSize={glyph.icon ? 8.5 : 13}
      fontWeight={600}
      fill={glyph.color}
      fontFamily="'Segoe UI', system-ui, sans-serif"
    >
      {glyph.abbr}
      {hasDeg && (
        <tspan fontSize={glyph.icon ? 7 : 9} dy={-4}>
          {glyph.degree}
        </tspan>
      )}
      {glyph.retro && (
        <tspan fontSize={glyph.icon ? 8 : 12} dy={hasDeg ? 4 : 0} fill="#c62828">
          *
        </tspan>
      )}
    </text>
  );

  if (glyph.icon) {
    return (
      <g>
        <image
          href={glyph.icon}
          x={x - ICON / 2}
          y={y - 11}
          width={ICON}
          height={ICON}
        />
        {label}
      </g>
    );
  }

  return label;
}
