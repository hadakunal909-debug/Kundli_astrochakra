import type { KundliResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function ReportCover({ data }: { data: KundliResponse }) {
  const { input, kundli } = data;
  return (
    <section className="report-cover">
      <div className="cover-brand">
        <span className="brand-mark">🪐</span>
        <span className="cover-brand-name">Astrochakra</span>
      </div>

      <div className="cover-main">
        <p className="cover-kicker">Vedic Janam Kundli</p>
        <h1 className="cover-name">{data.name}</h1>
        <dl className="cover-facts">
          <div>
            <dt>Date of Birth</dt>
            <dd>{formatDate(input.localDate)}</dd>
          </div>
          <div>
            <dt>Time of Birth</dt>
            <dd>{input.localTime}</dd>
          </div>
          <div>
            <dt>Place of Birth</dt>
            <dd>{input.place.label}</dd>
          </div>
          <div>
            <dt>Ascendant</dt>
            <dd>{kundli.ascendant.rashiName}</dd>
          </div>
          <div>
            <dt>Moon Sign</dt>
            <dd>{kundli.avkahada?.moonSign ?? kundli.planets["Moon"]?.rashiName}</dd>
          </div>
          <div>
            <dt>Nakshatra</dt>
            <dd>
              {kundli.avkahada?.nakshatra ?? kundli.ascendant.nakshatra}
              {kundli.avkahada ? ` (pada ${kundli.avkahada.nakshatraPada})` : ""}
            </dd>
          </div>
        </dl>
      </div>

      <div className="cover-footer">
        <span>Prepared on {formatDate(new Date().toISOString())}</span>
        <span>www.astrochakra.co</span>
      </div>
    </section>
  );
}
