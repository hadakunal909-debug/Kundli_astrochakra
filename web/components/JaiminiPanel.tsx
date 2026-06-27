import type { KundliResponse } from "@/lib/types";

export default function JaiminiPanel({ data }: { data: KundliResponse }) {
  const j = data.kundli.jaimini;
  if (!j) return <p className="meta-line">Jaimini data is not available for this chart.</p>;

  return (
    <div>
      <div className="ov-grid">
        <div className="ov-card">
          <div className="ov-label">Atmakaraka (Soul)</div>
          <div className="ov-value">{j.atmakaraka}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Karakamsa (AK in Navamsa)</div>
          <div className="ov-value">{j.karakamsa}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Arudha Lagna</div>
          <div className="ov-value">{j.arudhaLagna}</div>
        </div>
        <div className="ov-card">
          <div className="ov-label">Upapada Lagna</div>
          <div className="ov-value">{j.upapadaLagna}</div>
        </div>
      </div>

      <h3 className="dasha-heading">Chara Karakas</h3>
      <table className="planet-table">
        <thead>
          <tr>
            <th>Karaka</th>
            <th>Planet</th>
            <th>Degrees in sign</th>
          </tr>
        </thead>
        <tbody>
          {j.karakas.map((c) => (
            <tr key={c.karaka}>
              <td>{c.karaka}</td>
              <td>{c.planet}</td>
              <td>{c.degree.toFixed(2)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta-line">
        The Chara (movable) Karakas are the planets ranked by how far they have advanced in
        their sign. The Atmakaraka — the planet with the highest degree — signifies the soul's
        chief desire; the Arudha Lagna shows how the world perceives you.
      </p>
    </div>
  );
}
