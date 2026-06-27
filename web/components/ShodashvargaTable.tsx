import type { KundliResponse } from "@/lib/types";
import { VARGAS } from "@/lib/jyotish-ui";

const SHORT = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
const ROWS = [
  "Ascendant", "Sun", "Moon", "Mars", "Mercury",
  "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

export default function ShodashvargaTable({ data }: { data: KundliResponse }) {
  const vargas = data.kundli.vargas;
  if (!vargas) return <p className="meta-line">Divisional data not available.</p>;

  const signFor = (row: string, key: string): string => {
    const v = vargas[key];
    if (!v) return "";
    const r1 = row === "Ascendant" ? v.ascendant.rashi : v.planets[row]?.rashi;
    return r1 ? SHORT[r1 - 1] : "";
  };

  return (
    <div className="av-scroll">
      <table className="av-table varga-table">
        <thead>
          <tr>
            <th>Body</th>
            {VARGAS.map((v) => (
              <th key={v.key}>{v.key.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row}>
              <td className="av-planet">{row}</td>
              {VARGAS.map((v) => (
                <td key={v.key}>{signFor(row, v.key)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
