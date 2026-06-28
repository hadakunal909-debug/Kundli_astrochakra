"use client";

import type { KundliResponse } from "@/lib/types";
import { getPremiumContent } from "@/lib/premium/content";
import type { Band } from "@/lib/premium/scores";
import Overview from "@/components/Overview";
import Numerology from "@/components/Numerology";
import Doshas from "@/components/Doshas";

function bandClass(b: Band) {
  return b === "Strong" ? "sc-strong" : b === "Good" ? "sc-good" : b === "Moderate" ? "sc-mod" : "sc-dev";
}

// Band label for a raw 0–100 value (same thresholds as the life-area scores).
const valueBand = (v: number): Band => (v >= 80 ? "Strong" : v >= 65 ? "Good" : v >= 50 ? "Moderate" : "Developing");
const ordinal = (n: number) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
// What each house (bhava) governs — brief, original phrasings of the classical significations.
const HOUSE_GOVERNS = [
  "Self, body & vitality",
  "Wealth, speech & family",
  "Courage, siblings & initiative",
  "Home, mother & inner peace",
  "Creativity, children & intellect",
  "Health, service & obstacles",
  "Partnership & marriage",
  "Transformation, longevity & the hidden",
  "Fortune, dharma & higher learning",
  "Career, status & action",
  "Gains, networks & aspirations",
  "Release, expenses & spirituality",
];

function ScoreBar({ label, value, band, note }: { label: string; value: number; band: Band; note?: string }) {
  return (
    <div className="score-row" title={note}>
      <div className="score-head">
        <span className="score-label">{label}</span>
        <span className={`score-val ${bandClass(band)}`}>{value}</span>
      </div>
      <div className="score-track">
        <div className={`score-fill ${bandClass(band)}`} style={{ width: `${value}%` }} />
      </div>
      {note && <div className="score-note">{note}</div>}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="premium-section">
      <h2 className="premium-h">
        <span className="premium-n">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PremiumReport({ data }: { data: KundliResponse }) {
  const c = getPremiumContent(data);
  const s = c.s;
  const topAspects = [...s.factors.aspects.records]
    .filter((r) => r.score !== 0)
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 12);

  return (
    <div className="premium">
      {/* Score dashboard */}
      <div className="premium-hero">
        <div className="cs-gauge">
          <div className="cs-value">{s.chartStrength}</div>
          <div className="cs-label">Chart Strength</div>
        </div>
        <div className="score-grid">
          {s.scores.map((x) => (
            <ScoreBar key={x.key} label={x.label} value={x.value} band={x.band} note={x.note} />
          ))}
        </div>
      </div>
      {s.bestDecade && (
        <p className="premium-best">
          ★ Most Empowered Period: <strong>ages {s.bestDecade.fromAge}–{s.bestDecade.toAge}</strong>{" "}
          ({s.bestDecade.fromYear}–{s.bestDecade.toYear}, {s.bestDecade.planet} Mahadasha)
        </p>
      )}
      <p className="meta-line">
        Scores are built on classical strength: graded dignity (with Neecha Bhanga &amp;
        Vargottama), Shadbala, Ashtakavarga, functional benefic/malefic nature, planetary
        aspects (drishti) and the relevant divisional charts (D9/D10/D2…).
      </p>

      <Section n={1} title="Birth Chart Summary">
        <Overview data={data} />
      </Section>

      <Section n={2} title="Life Theme"><p>{c.lifeTheme}</p></Section>

      <Section n={3} title="Career Direction">
        <p>{c.career.text}</p>
        <p className="meta-line">Aligned fields: {c.career.industries.join(" · ")}</p>
      </Section>

      <Section n={4} title="Money & Finance"><p>{c.money}</p></Section>
      <Section n={5} title="Relationships"><p>{c.relationships}</p></Section>
      <Section n={6} title="Personality"><p>{c.personality}</p></Section>

      <Section n={7} title="Planet Utilization">
        <table className="planet-table">
          <thead><tr><th>Planet</th><th>Purpose</th><th>Status</th><th>How to activate</th></tr></thead>
          <tbody>
            {c.planetUse.map((p) => (
              <tr key={p.planet}>
                <td><strong>{p.planet}</strong></td>
                <td>{p.purpose}</td>
                <td>{p.strength} ({p.util})</td>
                <td>{p.activation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <section className="premium-section">
        <h2 className="premium-h"><span className="premium-n">◑</span>Planetary Aspects (Drishti)</h2>
        <p className="meta-line">
          Each planet's aspects strengthen (+) or challenge (−) the houses they fall on — this is
          part of how the scores above are calculated.
        </p>
        <table className="planet-table">
          <thead><tr><th>Planet</th><th>Aspects house</th><th>On</th><th>Effect</th></tr></thead>
          <tbody>
            {topAspects.map((r, i) => (
              <tr key={i}>
                <td><strong>{r.from}</strong></td>
                <td>{r.toHouse}</td>
                <td>{r.targets.length ? r.targets.join(", ") : "—"}</td>
                <td>
                  <span className={`tag ${r.score > 0 ? "tag-direct" : "tag-retro"}`}>
                    {r.score > 0 ? `+${r.score}` : r.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="premium-section">
        <h2 className="premium-h"><span className="premium-n">⌂</span>House (Bhava) Strengths</h2>
        <p className="meta-line">
          Each house&apos;s overall strength (0–100), blending its lord, the natural house karaka,
          Ashtakavarga, functional occupants, planetary aspects and argala (intervention from the
          2nd/4th/11th). This is the house-level foundation the life-area scores draw on.
        </p>
        <table className="planet-table">
          <thead><tr><th>House</th><th>Governs</th><th>Strength</th></tr></thead>
          <tbody>
            {HOUSE_GOVERNS.map((gov, i) => {
              const h = i + 1;
              const v = Math.round(s.factors.houseStrength[h] ?? 0);
              return (
                <tr key={h}>
                  <td><strong>{ordinal(h)}</strong></td>
                  <td>{gov}</td>
                  <td><span className={`score-val ${bandClass(valueBand(v))}`}>{v}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Section n={8} title="Yogakaraka Planet"><p>{c.yogakaraka}</p></Section>
      <Section n={9} title="Bhagya (Fortune) Planet"><p>{c.bhagya}</p></Section>

      <Section n={10} title="Numerology"><Numerology data={data} /></Section>

      <Section n={11} title="Strengths & Improvement Areas">
        <div className="sw-grid">
          <div>
            <h4 className="sw-h sw-pos">Top strengths</h4>
            <ul>{c.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div>
            <h4 className="sw-h sw-neg">Areas to grow</h4>
            <ul>{c.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section n={12} title="Yogas">
        {c.yogas.length ? (
          <ul className="yoga-list">
            {c.yogas.map((y) => <li key={y.name}><strong>{y.name}</strong> — {y.detail}</li>)}
          </ul>
        ) : (
          <p className="meta-line">No major classical yogas detected; your strength comes from individual planetary placements.</p>
        )}
      </Section>

      <Section n={13} title="Doshas"><Doshas data={data} /></Section>

      <Section n={14} title="Mahadasha — Current & Upcoming">
        {c.mahadasha.map((m, i) => (
          <div key={i} className="md-block">
            <div className="md-title">{m.title}</div>
            <p>{m.text}</p>
          </div>
        ))}
      </Section>

      <Section n={15} title="Major Transits (Gochar)">
        <table className="planet-table">
          <thead><tr><th>Planet</th><th>Sign now</th><th>From Moon</th><th>Influence</th></tr></thead>
          <tbody>
            {c.transits.map((t) => (
              <tr key={t.planet}>
                <td><strong>{t.planet}</strong></td><td>{t.sign}</td><td>{t.house}</td><td>{t.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n={16} title="Lucky Factors">
        <dl className="kv">
          <dt>Numbers</dt><dd>{c.lucky.numbers}</dd>
          <dt>Days</dt><dd>{c.lucky.days}</dd>
          <dt>Colours</dt><dd>{c.lucky.colors}</dd>
          <dt>Gemstone</dt><dd>{c.lucky.gem}</dd>
          <dt>Direction</dt><dd>{c.lucky.direction}</dd>
          <dt>Deity</dt><dd>{c.lucky.deity}</dd>
        </dl>
      </Section>

      <Section n={17} title="Health & Wellbeing"><p>{c.health}</p></Section>

      <Section n={18} title="Action Plan">
        <div className="plan-grid">
          <div><h4 className="sw-h">Daily</h4><ul>{c.actionPlan.daily.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          <div><h4 className="sw-h">Weekly</h4><ul>{c.actionPlan.weekly.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          <div><h4 className="sw-h">Monthly</h4><ul>{c.actionPlan.monthly.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        </div>
        <h4 className="sw-h" style={{ marginTop: 14 }}>30-Day Planet Activation</h4>
        <table className="planet-table">
          <thead><tr><th>Week</th><th>Planet</th><th>Focus</th></tr></thead>
          <tbody>
            {c.activation30.map((w) => (
              <tr key={w.week}><td>{w.week}</td><td><strong>{w.planet}</strong></td><td>{w.focus}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n={19} title="Planet Scorecard">
        <table className="planet-table">
          <thead><tr><th>Planet</th><th>Strength</th><th>Utilization</th><th>Action</th></tr></thead>
          <tbody>
            {c.scorecard.map((r) => (
              <tr key={r.planet}>
                <td><strong>{r.planet}</strong></td><td>{r.strengthLabel}</td><td>{r.util}/100</td><td>{r.tip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n={20} title="Final Roadmap">
        <dl className="kv">
          <dt>Purpose</dt><dd>{c.roadmap.purpose}</dd>
          <dt>Career</dt><dd>{c.roadmap.career}</dd>
          <dt>Wealth</dt><dd>{c.roadmap.wealth}</dd>
          <dt>Opportunities</dt><dd>{c.roadmap.opportunities}</dd>
          <dt>Mistakes to avoid</dt><dd>{c.roadmap.cautions}</dd>
        </dl>
      </Section>
    </div>
  );
}
