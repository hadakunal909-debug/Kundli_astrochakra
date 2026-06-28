import type { KundliResponse } from "@/lib/types";
import { getFactors } from "@/lib/premium/factors";
import type { DetectedYoga, YogaCategory } from "@/lib/premium/yogas";

// The full detected-yoga catalogue, grouped by category and shown alongside the
// Doshas. Auspicious combinations (Raja, Dhana, Mahapurusha…) are highlighted;
// afflictions (arishta yogas) are flagged in red.

const ORDER: { key: YogaCategory; label: string }[] = [
  { key: "Mahapurusha", label: "Pancha Mahapurusha Yogas" },
  { key: "Raja", label: "Raja Yogas" },
  { key: "RajaSambandha", label: "Raja-Sambandha (Royal Association) Yogas" },
  { key: "Dhana", label: "Dhana (Wealth) Yogas" },
  { key: "Surya", label: "Surya (Sun) Yogas" },
  { key: "Chandra", label: "Chandra (Moon) Yogas" },
  { key: "Parivartana", label: "Parivartana (Exchange) Yogas" },
  { key: "Auspicious", label: "Other Auspicious Yogas" },
  { key: "Nabhasa", label: "Nabhasa (Structural) Yogas" },
  { key: "Affliction", label: "Afflictions / Arishta Yogas" },
];

const GOLD: YogaCategory[] = ["Mahapurusha", "Raja", "RajaSambandha"];

function YogaCard({ y }: { y: DetectedYoga }) {
  const gold = GOLD.includes(y.category);
  const cardCls = gold ? " yoga-card--raja" : y.tone === "bad" ? " yoga-card--bad" : "";
  const badgeCls = y.tone === "bad" ? "is-affliction" : y.tone === "neutral" ? "is-neutral" : "is-yoga";
  const badge = y.tone === "bad" ? "Affliction" : "Present";
  const strLabel = (s: number) => (s >= 75 ? "Strong" : s >= 55 ? "Good" : s >= 40 ? "Moderate" : "Weak");
  return (
    <div className={`dosha-card${cardCls}`}>
      <div className="dosha-card-head">
        <span className="dosha-title">{y.name}</span>
        <span className="dosha-head-right">
          {typeof y.strength === "number" && (
            <span className="yoga-strength" title="How strongly this yoga fructifies (based on the dignity, avastha & placement of its planets)">
              {strLabel(y.strength)} · {y.strength}
            </span>
          )}
          <span className={`dosha-status ${badgeCls}`}>{badge}</span>
        </span>
      </div>
      <div className="dosha-body">
        <p>{y.detail}</p>
      </div>
    </div>
  );
}

export default function Yogas({ data }: { data: KundliResponse }) {
  const yogas = getFactors(data).yogas;
  const rajaCount = yogas.filter((y) => y.category === "Raja").length;
  const afflictionCount = yogas.filter((y) => y.tone === "bad").length;

  return (
    <div className="dosha-list">
      <p className="meta-line">
        Every classical combination (yoga) the engine detects in your chart, grouped by
        family — Pancha Mahapurusha, Raja, Dhana, Surya/Chandra, Parivartana, Nabhasa and
        the named auspicious &amp; arishta (affliction) yogas.
        {yogas.length > 0 &&
          ` ${yogas.length} detected — ${rajaCount} Raja yoga${rajaCount === 1 ? "" : "s"}, ${afflictionCount} affliction${afflictionCount === 1 ? "" : "s"}.`}
      </p>

      {ORDER.map(({ key, label }) => {
        const group = yogas.filter((y) => y.category === key);
        if (!group.length) return null;
        return (
          <div key={key}>
            <h3 className="yoga-group-h">{label}</h3>
            {group.map((y) => (
              <YogaCard key={y.name} y={y} />
            ))}
          </div>
        );
      })}

      {yogas.length === 0 && (
        <div className="dosha-card">
          <div className="dosha-card-head">
            <span className="dosha-title">No major yogas</span>
            <span className="dosha-status is-absent">None detected</span>
          </div>
          <div className="dosha-body">
            <p>
              No major classical yogas were detected in your chart. Your strengths come from
              individual planetary placements rather than named combinations — see the Premium
              Report and Planet Scorecard for those details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
