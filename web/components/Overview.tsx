import type { KundliResponse } from "@/lib/types";
import { lordOfRashi } from "@/lib/jyotish-ui";
import { currentDasha } from "@/lib/dasha";
import { formatDate } from "@/lib/format";

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="ov-card">
      <div className="ov-label">{label}</div>
      <div className="ov-value">{value}</div>
      {sub && <div className="ov-sub">{sub}</div>}
    </div>
  );
}

export default function Overview({ data }: { data: KundliResponse }) {
  const k = data.kundli;
  const moon = k.planets["Moon"];
  const sun = k.planets["Sun"];
  const { maha, antar } = currentDasha(data);

  return (
    <div className="ov-grid">
      <Card
        label="Ascendant (Lagna)"
        value={k.ascendant.rashiName}
        sub={`Lord ${lordOfRashi(k.ascendant.rashi)} · ${k.ascendant.nakshatra} (pada ${k.ascendant.pada})`}
      />
      {moon && (
        <Card
          label="Moon — Janma Rashi"
          value={moon.rashiName}
          sub={`${moon.nakshatra} (pada ${moon.pada})`}
        />
      )}
      {sun && (
        <Card
          label="Sun — Surya Rashi"
          value={sun.rashiName}
          sub={sun.nakshatra}
        />
      )}
      <Card
        label="Current Dasha"
        value={maha ? `${maha.planet} › ${antar ? antar.planet : "—"}` : "—"}
        sub={
          antar
            ? `until ${formatDate(antar.end)}`
            : maha
              ? `until ${formatDate(maha.end)}`
              : undefined
        }
      />
    </div>
  );
}
