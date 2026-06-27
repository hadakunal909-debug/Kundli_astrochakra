import type { KundliResponse } from "@/lib/types";
import { getShadbala } from "@/lib/shadbala";

export default function Shadbala({ data }: { data: KundliResponse }) {
  const rows = getShadbala(data);
  const ranked = [...rows].sort((a, b) => b.rupas - a.rupas);

  return (
    <div>
      <p className="meta-line">
        Shadbala — the six-fold strength of each planet, shown in Virupas (60 Virupas = 1
        Rupa). A planet meeting its required Rupas is considered strong. These are indicative:
        a few intricate Kala sub-balas and Drik bala are simplified.
      </p>

      <div className="av-scroll">
        <table className="av-table">
          <thead>
            <tr>
              <th>Planet</th>
              <th>Sthana</th>
              <th>Dig</th>
              <th>Kala</th>
              <th>Cheshta</th>
              <th>Naisargika</th>
              <th>Total</th>
              <th>Rupas</th>
              <th>Need</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.planet}>
                <td className="av-planet">{r.planet}</td>
                <td>{r.sthana}</td>
                <td>{r.dig}</td>
                <td>{r.kala}</td>
                <td>{r.cheshta}</td>
                <td>{r.naisargika}</td>
                <td className="av-total">{r.totalVirupa}</td>
                <td>{r.rupas}</td>
                <td>{r.required}</td>
                <td>
                  <span className={`tag ${r.strong ? "tag-direct" : "tag-retro"}`}>
                    {r.strong ? "Strong" : "Weak"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="meta-line">
        Strongest to weakest: <strong>{ranked.map((r) => r.planet).join(" › ")}</strong>.
      </p>
    </div>
  );
}
