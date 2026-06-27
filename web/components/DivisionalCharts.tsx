"use client";

import { useState } from "react";
import type { KundliResponse } from "@/lib/types";
import { VARGAS, buildVarga, buildVargaHouses } from "@/lib/jyotish-ui";
import ChartWithHouses from "./ChartWithHouses";
import NorthChart from "./NorthChart";

type Style = "north" | "south";

export default function DivisionalCharts({ data }: { data: KundliResponse }) {
  const [style, setStyle] = useState<Style>("north");
  const [key, setKey] = useState("d1");

  const idx = Math.max(0, VARGAS.findIndex((v) => v.key === key));
  const meta = VARGAS[idx];
  const cd = buildVarga(data, meta.key);
  const houses = buildVargaHouses(data, meta.key);

  const step = (delta: number) => {
    const n = (idx + delta + VARGAS.length) % VARGAS.length;
    setKey(VARGAS[n].key);
  };

  return (
    <div>
      {/* On screen: one large, interactive chart with a picker + detail panel. */}
      <div className="varga-screen">
        <div className="varga-toolbar">
          <div className="seg">
            <button
              className={`seg-btn${style === "north" ? " active" : ""}`}
              onClick={() => setStyle("north")}
            >
              North Indian
            </button>
            <button
              className={`seg-btn${style === "south" ? " active" : ""}`}
              onClick={() => setStyle("south")}
            >
              South Indian
            </button>
          </div>

          <div className="varga-picker">
            <button className="btn-ghost varga-nav" onClick={() => step(-1)} aria-label="Previous chart">
              ‹
            </button>
            <select value={meta.key} onChange={(e) => setKey(e.target.value)}>
              {VARGAS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label} — {v.purpose}
                </option>
              ))}
            </select>
            <button className="btn-ghost varga-nav" onClick={() => step(1)} aria-label="Next chart">
              ›
            </button>
          </div>
        </div>

        {cd && houses ? (
          <ChartWithHouses
            key={meta.key + style}
            chartData={cd}
            title={meta.label}
            houses={houses}
            style={style}
          />
        ) : (
          <p className="meta-line">This chart is not available.</p>
        )}
        <p className="varga-count">
          {meta.purpose} · Chart {idx + 1} of {VARGAS.length}
        </p>
      </div>

      {/* In the printed report: every divisional chart, as a grid. */}
      <div className="varga-print">
        <div className="varga-grid">
          {VARGAS.map((v) => {
            const c = buildVarga(data, v.key);
            if (!c) return null;
            return (
              <div className="varga-cell" key={v.key}>
                <NorthChart data={c} title={v.label} />
                <p className="varga-purpose">{v.purpose}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
