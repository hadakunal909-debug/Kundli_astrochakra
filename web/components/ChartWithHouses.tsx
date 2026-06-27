"use client";

import { useEffect, useRef, useState } from "react";
import {
  lordOfRashi,
  BHAVA_NAMES,
  RASHI_NAMES,
  PLANET_ICON,
  PLANET_COLOR,
  type ChartData,
  type HouseDetail,
  type PlanetDetail,
} from "@/lib/jyotish-ui";
import NorthChart from "./NorthChart";
import SouthChart from "./SouthChart";

function PlanetRow({ name, sub, status, dignity, iconName }: PlanetDetail) {
  const icon = iconName ? PLANET_ICON[iconName] : undefined;
  const color = iconName ? PLANET_COLOR[iconName] ?? "#555" : "#9a978f";
  return (
    <div className="planet-row">
      {icon ? (
        <img src={icon} alt="" className="planet-row-icon" />
      ) : (
        <span className="planet-row-dot" style={{ background: color }} />
      )}
      <div className="planet-row-main">
        <span className="planet-row-name">{name}</span>
        {sub && <span className="planet-row-sub">{sub}</span>}
      </div>
      <div className="planet-row-tags">
        {status && (
          <span className={`tag ${status === "Retrograde" ? "tag-retro" : "tag-direct"}`}>
            {status}
          </span>
        )}
        {dignity && <span className="tag tag-rel">{dignity}</span>}
      </div>
    </div>
  );
}

export default function ChartWithHouses({
  chartData,
  title,
  houses,
  style = "north",
}: {
  chartData: ChartData;
  title: string;
  houses: HouseDetail[];
  style?: "north" | "south";
}) {
  const [sel, setSel] = useState(1);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sel]);

  const Chart = style === "south" ? SouthChart : NorthChart;

  return (
    <div className="chart-explorer">
      <div className="chart-explorer-chart">
        <Chart data={chartData} title={title} selectedHouse={sel} onSelectHouse={setSel} />
        <p className="meta-line">Tap any house to see its sign and planets.</p>
      </div>

      <div className="chart-explorer-panel">
        {houses.map((h, idx) => {
          const n = idx + 1;
          const active = sel === n;
          return (
            <div
              key={n}
              ref={active ? activeRef : undefined}
              className={`house-block${active ? " active" : ""}`}
              onClick={() => setSel(n)}
            >
              <div className="house-head">
                <span className="house-no">House {n}</span>
                <span className="house-bhava">{BHAVA_NAMES[n - 1]}</span>
                <span className="house-sign">
                  {RASHI_NAMES[h.signIndex0]} · {lordOfRashi(h.signIndex0 + 1)}
                </span>
              </div>
              <div className="house-planets">
                {h.planets.length === 0 && (
                  <p className="house-empty">No planets in this house</p>
                )}
                {h.planets.map((p, i) => (
                  <PlanetRow key={i} {...p} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
