import type { KundliResponse } from "@/lib/types";
import { PLANET_ICON, PLANET_COLOR } from "@/lib/jyotish-ui";

// Houses from the Moon traditionally considered favourable for transit, per planet.
const GOOD_FROM_MOON: Record<string, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 10, 11],
  Ketu: [3, 6, 10, 11],
};

export default function Transit({ data }: { data: KundliResponse }) {
  const t = data.kundli.transit;
  if (!t) return <p className="meta-line">Transit data is not available.</p>;

  const when = new Date(t.asOf).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div>
      <p className="meta-line">
        Current planetary transits (Gochar) for <strong>{when}</strong>, counted from your
        natal Moon sign (<strong>{t.moonSign}</strong>).
      </p>
      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Sign now</th>
            <th>From Moon</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          {t.planets.map((p) => {
            const fav = GOOD_FROM_MOON[p.planet]?.includes(p.houseFromMoon);
            return (
              <tr key={p.planet}>
                <td>
                  <span className="tx-planet">
                    {PLANET_ICON[p.planet] ? (
                      <img src={PLANET_ICON[p.planet]} alt="" className="tx-icon" />
                    ) : (
                      <span className="pred-dot" style={{ background: PLANET_COLOR[p.planet] ?? "#555" }} />
                    )}
                    {p.planet}
                    {p.retrograde && <span className="tx-retro"> (R)</span>}
                  </span>
                </td>
                <td>{p.sign}</td>
                <td>{p.houseFromMoon}</td>
                <td>
                  <span className={`tag ${fav ? "tag-direct" : "tag-retro"}`}>
                    {fav ? "Favourable" : "Challenging"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="meta-line">
        Transit effects are general and strongest for the slower planets (Jupiter, Saturn,
        Rahu and Ketu); they combine with your running dasha for the full picture.
      </p>
    </div>
  );
}
