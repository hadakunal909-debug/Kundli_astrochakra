import type { KundliResponse } from "@/lib/types";
import { formatOffset } from "@/lib/time";
import ChartExplorer from "./ChartExplorer";

export default function Charts({ data }: { data: KundliResponse }) {
  return (
    <div>
      <ChartExplorer data={data} />
      <p className="meta-line">
        Lagna: <strong>{data.kundli.ascendant.rashiName}</strong> ·{" "}
        {data.kundli.ascendant.nakshatra} (pada {data.kundli.ascendant.pada}) ·
        Zone {data.input.ianaZone} ({formatOffset(data.input.utcOffsetMinutes)}) ·
        Navamsa (D9) and all divisional charts are in the Divisional tab.
      </p>
    </div>
  );
}
