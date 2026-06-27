import type { KundliResponse } from "@/lib/types";
import { formatDate, formatClock } from "@/lib/format";
import { formatOffset } from "@/lib/time";

function Row({ k, v }: { k: string; v?: string | number }) {
  return (
    <tr>
      <th>{k}</th>
      <td>{v ?? "—"}</td>
    </tr>
  );
}

export default function BasicDetailsSection({ data }: { data: KundliResponse }) {
  const { input, kundli, panchangam: p } = data;
  const av = kundli.avkahada;
  const md = kundli.dasha?.mahadashas;
  const zone = input.ianaZone;

  // Balance of the dasha running at birth (same method as the Dasha section).
  let dashaBalance = "—";
  if (md && md.length) {
    const birth = new Date(input.utcInstant).getTime();
    let days = Math.max(0, (new Date(md[0].endTime).getTime() - birth) / 86400000);
    const y = Math.floor(days / 365.25);
    days -= y * 365.25;
    const mo = Math.floor(days / 30.4375);
    days -= mo * 30.4375;
    dashaBalance = `${md[0].planet} ${y}Y ${mo}M ${Math.round(days)}D`;
  }

  return (
    <div className="two-col">
      <div>
        <h3 className="subhead">Birth Details</h3>
        <table className="detail-table">
          <tbody>
            <Row k="Name" v={data.name} />
            <Row k="Date of Birth" v={formatDate(input.localDate)} />
            <Row k="Time of Birth" v={input.localTime} />
            <Row k="Day" v={p?.varaName} />
            <Row k="Place" v={input.place.label} />
            <Row k="Latitude" v={input.place.lat.toFixed(4)} />
            <Row k="Longitude" v={input.place.lon.toFixed(4)} />
            <Row k="Timezone" v={`${zone} (${formatOffset(input.utcOffsetMinutes)})`} />
            {p && <Row k="Sunrise" v={formatClock(p.sunrise, zone)} />}
            {p && <Row k="Sunset" v={formatClock(p.sunset, zone)} />}
            <Row k="Tithi" v={p ? `${p.tithiName} (${p.paksha})` : undefined} />
            <Row k="Yoga" v={p?.yogaName} />
            <Row k="Karana" v={p?.karana} />
            <Row k="Dasha Balance" v={dashaBalance} />
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="subhead">Avkahada Chakra</h3>
        <table className="detail-table">
          <tbody>
            <Row k="Lagna (Ascendant)" v={av?.lagna ?? kundli.ascendant.rashiName} />
            <Row k="Ascendant Lord" v={av?.lagnaLord} />
            <Row k="Rashi (Moon Sign)" v={av?.moonSign} />
            <Row k="Rashi Lord" v={av?.moonSignLord} />
            <Row k="Nakshatra–Pada" v={av ? `${av.nakshatra}-${av.nakshatraPada}` : undefined} />
            <Row k="Star Lord" v={av?.nakshatraLord} />
            <Row k="Sun Sign" v={av?.sunSignSidereal} />
            <Row k="Name Syllable" v={av?.nameSyllable} />
            <Row k="Varna" v={av?.varna} />
            <Row k="Vashya" v={av?.vashya} />
            <Row k="Yoni" v={av?.yoni} />
            <Row k="Gana" v={av?.gana} />
            <Row k="Nadi" v={av?.nadi} />
            <Row k="Paya" v={av?.paya} />
            <Row k="Tatva" v={av?.tatva} />
          </tbody>
        </table>
      </div>

      {av && (
        <div className="two-col-full">
          <h3 className="subhead">Favourable Points</h3>
          <table className="detail-table">
            <tbody>
              <Row k="Lucky Numbers" v={av.favourable.luckyNumbers.join(", ")} />
              <Row k="Lucky Days" v={av.favourable.luckyDays.join(", ")} />
              <Row k="Lucky Colours" v={av.favourable.luckyColors.join(", ")} />
              <Row k="Gemstone" v={av.favourable.gemstone} />
              <Row k="Metal" v={av.favourable.metal} />
              <Row k="Direction" v={av.favourable.direction} />
              <Row k="Deity" v={av.favourable.deity} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
