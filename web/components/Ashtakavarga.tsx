import type { KundliResponse } from "@/lib/types";

const SIGNS = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
const AV_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export default function Ashtakavarga({ data }: { data: KundliResponse }) {
  const av = data.kundli.ashtakavarga;
  if (!av) {
    return (
      <p className="meta-line">Ashtakavarga is not available for this chart.</p>
    );
  }

  const savTotal = av.sav.reduce((a, b) => a + b, 0);

  // Highlight strong/weak signs in the SAV row (classic thresholds: ≥30 strong, ≤25 weak).
  const savClass = (n: number) =>
    n >= 30 ? "av-strong" : n <= 25 ? "av-weak" : "";

  return (
    <div>
      <p className="meta-line">
        Bhinnashtakavarga (per planet) and Sarvashtakavarga (SAV) bindus by sign.
        A sign with more bindus is stronger. SAV total ={" "}
        <strong>{savTotal}</strong> (classical 337).
      </p>

      <div className="av-scroll">
        <table className="av-table">
          <thead>
            <tr>
              <th>Planet</th>
              {SIGNS.map((s) => (
                <th key={s}>{s}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {AV_PLANETS.map((p) => (
              <tr key={p}>
                <td className="av-planet">{p}</td>
                {av.bav[p].map((n, i) => (
                  <td key={i}>{n}</td>
                ))}
                <td className="av-total">{av.bavTotals[p]}</td>
              </tr>
            ))}
            <tr className="av-sav-row">
              <td className="av-planet">SAV</td>
              {av.sav.map((n, i) => (
                <td key={i} className={savClass(n)}>
                  {n}
                </td>
              ))}
              <td className="av-total">{savTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="meta-line av-legend">
        <span className="av-chip av-strong">≥ 30 strong</span>
        <span className="av-chip av-weak">≤ 25 weak</span>
        in the Sarvashtakavarga row.
      </p>
    </div>
  );
}
