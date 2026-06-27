"use client";

import { useMemo, useState } from "react";
import type { KundliResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { subPeriodsOf, type Period } from "@/lib/dasha";

const LEVELS = [
  "Mahadasha",
  "Antardasha",
  "Pratyantardasha",
  "Sookshma",
  "Prana",
];
const MAX_DEPTH = 5;

function isNow(p: Period, now: number): boolean {
  return now >= p.start.getTime() && now < p.end.getTime();
}

function childrenOf(p: Period): Period[] {
  return subPeriodsOf(p.planet, p.start.getTime(), p.end.getTime());
}

export default function DashaTimeline({ data }: { data: KundliResponse }) {
  const { dasha } = data.kundli;
  const now = Date.now();

  const mahas: Period[] = useMemo(
    () =>
      dasha.mahadashas.map((m) => ({
        planet: m.planet,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
      })),
    [dasha],
  );

  // `path` = the chain of periods the user has drilled into (empty = top level).
  const [path, setPath] = useState<Period[]>([]);
  const depth = path.length; // 0 → showing Mahadasha, 4 → showing Prana
  const list = depth === 0 ? mahas : childrenOf(path[depth - 1]);
  const canDrill = depth < MAX_DEPTH - 1;

  // Balance of the dasha running at birth.
  const birth = new Date(data.input.utcInstant).getTime();
  let balance = "";
  if (mahas.length) {
    let days = Math.max(0, (mahas[0].end.getTime() - birth) / 86400000);
    const y = Math.floor(days / 365.25);
    days -= y * 365.25;
    const mo = Math.floor(days / 30.4375);
    days -= mo * 30.4375;
    balance = `${mahas[0].planet} ${y}Y ${mo}M ${Math.round(days)}D`;
  }

  // Drill straight to the currently-running sub-period (down to Sookshma → shows Prana).
  function goToCurrent() {
    const chain: Period[] = [];
    let pool = mahas;
    for (let d = 0; d < MAX_DEPTH - 1; d++) {
      const cur = pool.find((p) => isNow(p, now));
      if (!cur) break;
      chain.push(cur);
      pool = childrenOf(cur);
    }
    setPath(chain);
  }

  return (
    <div>
      <div className="dasha-balance">
        <div className="dasha-balance-label">Balance of Dasha at Birth</div>
        <div className="dasha-balance-value">{balance}</div>
      </div>

      {/* Breadcrumb — click any crumb to climb back to that level. */}
      <nav className="dasha-crumbs" aria-label="Dasha levels">
        <button
          className={`crumb${depth === 0 ? " active" : ""}`}
          onClick={() => setPath([])}
        >
          Mahadasha
        </button>
        {path.map((p, i) => (
          <span key={`${p.planet}-${i}`}>
            <span className="crumb-sep">›</span>
            <button
              className={`crumb${i === depth - 1 ? " active" : ""}`}
              onClick={() => setPath(path.slice(0, i + 1))}
            >
              {p.planet}
            </button>
          </span>
        ))}
      </nav>

      <p className="dasha-sub">
        Showing <strong>{LEVELS[depth]}</strong>
        {depth > 0 && <> of {path.map((p) => p.planet).join(" › ")}</>}.
        {canDrill && " Tap any row to open the next level."}
      </p>

      <table className="dasha-table drill">
        <thead>
          <tr>
            <th>{LEVELS[depth]}</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => {
            const cur = isNow(p, now);
            return (
              <tr
                key={`${p.planet}-${i}`}
                className={`${cur ? "dasha-current " : ""}${canDrill ? "dasha-drillable" : ""}`}
                onClick={canDrill ? () => setPath([...path, p]) : undefined}
              >
                <td>
                  {depth > 0 && (
                    <span className="dasha-path">
                      {path.map((a) => a.planet).join(" › ")} ›{" "}
                    </span>
                  )}
                  <span className="dasha-leaf">{p.planet}</span>
                  {canDrill && <span className="dasha-chev">›</span>}
                  {cur && <span className="dasha-badge">● Current</span>}
                </td>
                <td>{formatDate(p.start)}</td>
                <td>{formatDate(p.end)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="dasha-controls">
        {depth > 0 && (
          <button className="btn-ghost" onClick={() => setPath(path.slice(0, -1))}>
            ↑ Level up
          </button>
        )}
        <button className="btn-ghost" onClick={goToCurrent}>
          ● Go to current period
        </button>
      </div>

      <p className="meta-line">
        Birth Nakshatra: <strong>{dasha.birthNakshatra}</strong> (pada{" "}
        {dasha.nakshatraPada})
      </p>
    </div>
  );
}
