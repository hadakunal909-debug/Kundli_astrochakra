import type { KundliResponse } from "@/lib/types";
import { PLANET_ORDER, formatDMS, computeRelation } from "@/lib/jyotish-ui";

const NODES = new Set(["Rahu", "Ketu"]);

export default function PlanetTable({ data }: { data: KundliResponse }) {
  const { kundli } = data;

  return (
    <table className="planet-table">
      <thead>
        <tr>
          <th>Planet</th>
          <th>C</th>
          <th>R</th>
          <th>Rashi</th>
          <th>Longitude</th>
          <th>Nakshatra</th>
          <th>Pada</th>
          <th>Relation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Asc</strong></td>
          <td></td>
          <td></td>
          <td>{kundli.ascendant.rashiName}</td>
          <td>{formatDMS(kundli.ascendant.longitude)}</td>
          <td>{kundli.ascendant.nakshatra}</td>
          <td>{kundli.ascendant.pada}</td>
          <td></td>
        </tr>
        {PLANET_ORDER.filter((n) => kundli.planets[n]).map((name) => {
          const p = kundli.planets[name];
          return (
            <tr key={name}>
              <td>{name}</td>
              <td>{p.isCombust ? "C" : ""}</td>
              <td>{NODES.has(name) ? "-" : p.isRetrograde ? "R" : "D"}</td>
              <td>{p.rashiName}</td>
              <td>{formatDMS(p.longitude)}</td>
              <td>{p.nakshatra}</td>
              <td>{p.pada}</td>
              <td>{computeRelation(name, p.longitude)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
