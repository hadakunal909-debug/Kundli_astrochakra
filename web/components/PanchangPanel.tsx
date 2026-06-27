import type { KundliResponse } from "@/lib/types";
import { formatClock } from "@/lib/format";

export default function PanchangPanel({ data }: { data: KundliResponse }) {
  const p = data.panchangam;
  if (!p) {
    return (
      <p className="meta-line">
        Panchang details are not available for this chart.
      </p>
    );
  }
  const zone = data.input.ianaZone;

  return (
    <dl className="kv">
      <dt>Vara (weekday)</dt>
      <dd>{p.varaName}</dd>
      <dt>Tithi</dt>
      <dd>
        {p.tithiName} ({p.paksha} Paksha)
      </dd>
      <dt>Nakshatra</dt>
      <dd>
        {p.nakshatraName} — lord {p.nakshatraLord}
      </dd>
      <dt>Yoga</dt>
      <dd>{p.yogaName}</dd>
      <dt>Karana</dt>
      <dd>{p.karana}</dd>
      <dt>Masa (month)</dt>
      <dd>
        {p.masa?.name}
        {p.masa?.isAdhika ? " (Adhika)" : ""}
      </dd>
      <dt>Ritu (season)</dt>
      <dd>{p.ritu}</dd>
      <dt>Ayana</dt>
      <dd>{p.ayanaName}</dd>
      <dt>Samvat</dt>
      <dd>
        Vikram {p.samvat?.vikram}, Shaka {p.samvat?.shaka}
        {p.samvat?.samvatsara ? ` · ${p.samvat.samvatsara}` : ""}
      </dd>
      <dt>Sunrise / Sunset</dt>
      <dd>
        {formatClock(p.sunrise, zone)} / {formatClock(p.sunset, zone)}
      </dd>
    </dl>
  );
}
