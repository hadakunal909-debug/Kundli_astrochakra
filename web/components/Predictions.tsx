import type { KundliResponse } from "@/lib/types";
import { getPredictions } from "@/lib/predictions";
import { PLANET_ICON, PLANET_COLOR } from "@/lib/jyotish-ui";

export default function Predictions({ data }: { data: KundliResponse }) {
  const pr = getPredictions(data);

  return (
    <div className="predictions">
      <h3>{pr.ascendant.title}</h3>
      <p>{pr.ascendant.body}</p>

      <h3>{pr.moon.title}</h3>
      <p>{pr.moon.body}</p>

      <h3>Planetary Influences</h3>
      <div className="pred-list">
        {pr.planets.map((p) => {
          const icon = PLANET_ICON[p.planet];
          return (
            <div className="pred-planet" key={p.planet}>
              <div className="pred-planet-head">
                {icon ? (
                  <img src={icon} alt="" className="pred-icon" />
                ) : (
                  <span
                    className="pred-dot"
                    style={{ background: PLANET_COLOR[p.planet] ?? "#555" }}
                  />
                )}
                <span className="pred-name">{p.planet}</span>
                <span className="pred-meta">
                  House {p.house} · {p.sign}
                  {p.dignity ? ` · ${p.dignity}` : ""}
                </span>
              </div>
              <p className="pred-text">{p.text}</p>
            </div>
          );
        })}
      </div>

      <p className="meta-line">
        These notes are a general guide based on planetary placements; a full
        reading weighs aspects, strengths and dashas together.
      </p>
    </div>
  );
}
