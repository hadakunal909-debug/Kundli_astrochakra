import type { KundliResponse } from "@/lib/types";
import { getRemedies } from "@/lib/remedies";

export default function Remedies({ data }: { data: KundliResponse }) {
  const r = getRemedies(data);
  const g = r.lifeGem;

  return (
    <div className="remedy-wrap">
      <div className="remedy-card remedy-hero">
        <div className="remedy-hero-main">
          <span className="remedy-kicker">Life Gemstone (from your Ascendant lord {g.planet})</span>
          <span className="remedy-gem">{g.gem}</span>
          <span className="remedy-sub">
            {g.metal} · {g.finger} finger · wear on {g.day}
          </span>
        </div>
        <p className="remedy-note">
          A life (lagna) gemstone strengthens the lord of your Ascendant, supporting
          overall vitality and direction. Wear it only after it is energised, and ideally
          confirm suitability with an astrologer before use.
        </p>
      </div>

      <div className="remedy-card">
        <h4 className="remedy-h">Isht Devata (Chosen Deity)</h4>
        <p>
          Your Atmakaraka (soul planet) is <strong>{r.atmakaraka}</strong>. Read through
          the Karakamsa in your Navamsa, your Isht Devata is{" "}
          <strong>{r.ishtDevata.deity}</strong> ({r.ishtDevata.via}). Worshipping your
          chosen deity steadies the mind and supports your spiritual path.
        </p>
      </div>

      <div className="remedy-grid">
        <div className="remedy-card">
          <h4 className="remedy-h">Rudraksha</h4>
          <ul className="remedy-ul">
            {r.rudrakshas.map((x) => (
              <li key={x.planet}>
                <strong>{x.mukhi}</strong> — for {x.planet}
              </li>
            ))}
          </ul>
        </div>

        <div className="remedy-card">
          <h4 className="remedy-h">Mantras</h4>
          <ul className="remedy-ul">
            {r.mantras.map((x) => (
              <li key={x.planet}>
                {x.planet}: <em>{x.mantra}</em>
              </li>
            ))}
          </ul>
        </div>

        <div className="remedy-card">
          <h4 className="remedy-h">Daan (Charity)</h4>
          <ul className="remedy-ul">
            {r.daan.map((x) => (
              <li key={x.planet}>
                {x.planet}: {x.items}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="meta-line">
        Remedies are supportive measures, not guarantees. Gemstones in particular should be
        chosen carefully — when in doubt, mantras, charity and worship are always safe.
      </p>
    </div>
  );
}
