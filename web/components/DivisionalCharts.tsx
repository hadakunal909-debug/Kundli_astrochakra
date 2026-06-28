"use client";

import { useState } from "react";
import type { KundliResponse } from "@/lib/types";
import { ALL_VARGAS, buildVarga, buildVargaHouses } from "@/lib/jyotish-ui";
import ChartWithHouses from "./ChartWithHouses";
import NorthChart from "./NorthChart";
import SouthChart from "./SouthChart";

type Style = "north" | "south";
type View = "single" | "all";

export default function DivisionalCharts({ data }: { data: KundliResponse }) {
  const [style, setStyle] = useState<Style>("north");
  const [view, setView] = useState<View>("single");
  const [key, setKey] = useState("d1");

  const idx = Math.max(0, ALL_VARGAS.findIndex((v) => v.key === key));
  const meta = ALL_VARGAS[idx];
  const cd = buildVarga(data, meta.key);
  const houses = buildVargaHouses(data, meta.key);

  const step = (delta: number) => {
    const n = (idx + delta + ALL_VARGAS.length) % ALL_VARGAS.length;
    setKey(ALL_VARGAS[n].key);
  };

  return (
    <div>
      {/* On screen: a single interactive chart, or all 16 as a grid. */}
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

          <div className="seg">
            <button
              className={`seg-btn${view === "single" ? " active" : ""}`}
              onClick={() => setView("single")}
            >
              Single
            </button>
            <button
              className={`seg-btn${view === "all" ? " active" : ""}`}
              onClick={() => setView("all")}
            >
              All 60
            </button>
          </div>

          {view === "single" && (
            <div className="varga-picker">
              <button className="btn-ghost varga-nav" onClick={() => step(-1)} aria-label="Previous chart">
                ‹
              </button>
              <select value={meta.key} onChange={(e) => setKey(e.target.value)}>
                {ALL_VARGAS.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label} — {v.purpose}
                  </option>
                ))}
              </select>
              <button className="btn-ghost varga-nav" onClick={() => step(1)} aria-label="Next chart">
                ›
              </button>
            </div>
          )}
        </div>

        {view === "single" ? (
          <>
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
              {meta.purpose} · Chart {idx + 1} of {ALL_VARGAS.length}
            </p>
          </>
        ) : (
          <div className="varga-grid">
            {ALL_VARGAS.map((v) => {
              const c = buildVarga(data, v.key);
              if (!c) return null;
              return (
                <div className="varga-cell" key={v.key + style}>
                  {style === "north" ? (
                    <NorthChart data={c} title={v.label} />
                  ) : (
                    <SouthChart data={c} title={v.label} />
                  )}
                  <p className="varga-purpose">{v.purpose}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In the printed report: every divisional chart, as a grid. */}
      <div className="varga-print">
        <div className="varga-grid">
          {ALL_VARGAS.map((v) => {
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
