import type { KundliResponse } from "@/lib/types";
import { formatOffset } from "@/lib/time";
import { formatDate } from "@/lib/format";

export default function BirthSummary({ data }: { data: KundliResponse }) {
  const { input, kundli } = data;
  return (
    <dl className="kv">
      <dt>Name</dt>
      <dd>{data.name}</dd>
      <dt>Date of birth</dt>
      <dd>{formatDate(input.localDate)}</dd>
      <dt>Time of birth</dt>
      <dd>{input.localTime}</dd>
      <dt>Place</dt>
      <dd>{input.place.label}</dd>
      <dt>Coordinates</dt>
      <dd>
        {input.place.lat.toFixed(4)}, {input.place.lon.toFixed(4)}
      </dd>
      <dt>Timezone</dt>
      <dd>
        {input.ianaZone} ({formatOffset(input.utcOffsetMinutes)})
      </dd>
      <dt>Ascendant (Lagna)</dt>
      <dd>
        {kundli.ascendant.rashiName} — {kundli.ascendant.nakshatra} pada{" "}
        {kundli.ascendant.pada}
      </dd>
    </dl>
  );
}
