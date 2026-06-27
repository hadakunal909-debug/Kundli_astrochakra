"use client";

import { useState } from "react";
import type { KundliResponse } from "@/lib/types";

export default function Varshaphal({ data }: { data: KundliResponse }) {
  const v = data.kundli.varshaphal;
  const [idx, setIdx] = useState(0);
  if (!v || !v.charts.length) {
    return <p className="meta-line">Varshaphal is not available for this chart.</p>;
  }
  const c = v.charts[idx];
  const pravesh = new Date(c.varshaPravesh).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div>
      <p className="meta-line">
        Annual chart (Varshaphal / Tajika) — cast for the moment the Sun returns to its
        birth position each year (Varsha Pravesh).
      </p>

      <div className="seg year-seg">
        {v.charts.map((x, i) => (
          <button
            key={x.year}
            className={`seg-btn${i === idx ? " active" : ""}`}
            onClick={() => setIdx(i)}
          >
            {x.year}
          </button>
        ))}
      </div>

      <div className="ov-grid">
        <div className="ov-card">
          <div className="ov-label">Varsha Pravesh</div>
          <div className="ov-value" style={{ fontSize: 16 }}>{pravesh}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Annual Ascendant</div>
          <div className="ov-value">{c.ascendant}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Muntha</div>
          <div className="ov-value">{c.muntha.sign}</div>
          <div className="ov-sub">House {c.muntha.house}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Year Lord (Muntha lord)</div>
          <div className="ov-value">{c.yearLord}</div>
        </div>
      </div>

      <h3 className="dasha-heading">Annual Planetary Positions ({c.year})</h3>
      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Sign</th>
          </tr>
        </thead>
        <tbody>
          {c.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}</td>
              <td>{p.sign}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta-line">
        The Muntha and the year lord are quick indicators; a full Tajika reading also weighs
        the year lord by Panchavargeeya strength and the annual Sahams.
      </p>
    </div>
  );
}
