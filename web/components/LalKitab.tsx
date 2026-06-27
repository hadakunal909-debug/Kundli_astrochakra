import type { KundliResponse } from "@/lib/types";
import { getLalKitab } from "@/lib/lalkitab";
import NorthChart from "./NorthChart";

export default function LalKitab({ data }: { data: KundliResponse }) {
  const lk = getLalKitab(data);

  return (
    <div>
      <p className="meta-line">
        Lal Kitab Teva — planets shown in fixed houses (Aries = 1st house). The notes below
        are general remedy guidance in the Lal Kitab spirit.
      </p>

      <div className="lk-grid">
        <div className="lk-chart">
          <NorthChart data={lk.chart} title="Lal Kitab Chart" />
        </div>

        <div>
          <h3 className="dasha-heading">Ancestral Debts (Rin) — indicative</h3>
          <div className="dosha-list">
            {lk.debts.map((d) => (
              <div className="dosha-card" key={d.name}>
                <div className="dosha-card-head">
                  <span className="dosha-title" style={{ fontSize: 14 }}>{d.name}</span>
                  <span className={`dosha-status ${d.present ? "is-present" : "is-absent"}`}>
                    {d.present ? "Indicated" : "Not indicated"}
                  </span>
                </div>
                <div className="dosha-body">
                  <p style={{ fontSize: 13 }}>{d.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="dasha-heading">Planet Placements &amp; Remedy Guidance</h3>
      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>House</th>
            <th>Guidance</th>
          </tr>
        </thead>
        <tbody>
          {lk.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}</td>
              <td>{p.house}</td>
              <td style={{ fontWeight: 400 }}>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta-line">
        Debt indications use simplified, transparent rules and are a starting point, not a
        verdict. Remedies are gentle, ethical practices — adopt what resonates.
      </p>
    </div>
  );
}
