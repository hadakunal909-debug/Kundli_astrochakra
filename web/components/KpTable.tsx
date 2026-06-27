import type { KundliResponse } from "@/lib/types";

export default function KpTable({ data }: { data: KundliResponse }) {
  const kp = data.kundli.kp;
  if (!kp) return <p className="meta-line">KP data is not available for this chart.</p>;

  const rows = [kp.ascendant, ...kp.planets];

  return (
    <div>
      <p className="meta-line">
        Krishnamurti Paddhati significators — the Sign, Star (nakshatra) and Sub lord that
        own each body's exact longitude. In KP the <strong>Sub lord</strong> is the deciding
        factor.
      </p>
      <div className="av-scroll">
        <table className="av-table kp-table">
          <thead>
            <tr>
              <th>Body</th>
              <th>Sign</th>
              <th>Sign Lord</th>
              <th>Star (Nakshatra)</th>
              <th>Star Lord</th>
              <th>Sub Lord</th>
              <th>Sub-Sub</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="av-planet">{r.name}</td>
                <td>{r.sign}</td>
                <td>{r.signLord}</td>
                <td>{r.star}</td>
                <td>{r.starLord}</td>
                <td className="kp-sub">{r.sub}</td>
                <td>{r.subSub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="dasha-heading">Cuspal Sub Lords</h3>
      <div className="av-scroll">
        <table className="av-table kp-table">
          <thead>
            <tr>
              <th>House</th>
              <th>Sign</th>
              <th>Sign Lord</th>
              <th>Star Lord</th>
              <th>Sub Lord</th>
            </tr>
          </thead>
          <tbody>
            {kp.cusps.map((c) => (
              <tr key={c.house}>
                <td className="av-planet">{c.house}</td>
                <td>{c.sign}</td>
                <td>{c.signLord}</td>
                <td>{c.starLord}</td>
                <td className="kp-sub">{c.sub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta-line">
        Cuspal sub-lords are most precise when the chart uses the Placidus house system
        (selectable on the input form); with whole-sign houses they follow the sign cusps.
      </p>
    </div>
  );
}
