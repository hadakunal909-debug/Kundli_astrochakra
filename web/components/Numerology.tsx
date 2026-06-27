import type { KundliResponse } from "@/lib/types";
import { getNumerology, type NumberInsight } from "@/lib/numerology";

function NumberCard({ label, insight }: { label: string; insight: NumberInsight }) {
  return (
    <div className="num-block">
      <div className="num-badge">{insight.number}</div>
      <div className="num-body">
        <div className="num-head">
          <span className="num-label">{label}</span>
          <span className="num-lord">Ruled by {insight.lord}</span>
        </div>
        <p className="num-text">{insight.text}</p>
      </div>
    </div>
  );
}

export default function Numerology({ data }: { data: KundliResponse }) {
  const n = getNumerology(data.input.localDate, data.name);
  return (
    <div>
      <p className="meta-line">
        Lucky numbers: <strong>{n.luckyNumbers.join(", ")}</strong> · Favourable days:{" "}
        <strong>{n.luckyDays.join(", ")}</strong>
      </p>
      <div className="num-list">
        <NumberCard label="Radical Number (Mulank)" insight={n.radical} />
        <NumberCard label="Destiny Number (Bhagyank)" insight={n.destiny} />
        <NumberCard label="Name Number (Namank)" insight={n.nameNumber} />
      </div>
    </div>
  );
}
