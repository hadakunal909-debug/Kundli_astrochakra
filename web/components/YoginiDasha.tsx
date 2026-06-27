import type { KundliResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function YoginiDasha({ data }: { data: KundliResponse }) {
  const y = data.kundli.yogini;
  if (!y) return <p className="meta-line">Yogini Dasha is not available for this chart.</p>;

  const now = Date.now();
  const inRange = (a: string | Date, b: string | Date) =>
    now >= new Date(a).getTime() && now < new Date(b).getTime();

  const current = y.periods.find((p) => inRange(p.startTime, p.endTime));
  const antars = current?.antars ?? [];

  return (
    <div>
      <p className="meta-line">
        Yogini Dasha — an eight-fold, 36-year cycle. Your starting Yogini is{" "}
        <strong>{y.startYogini}</strong> (birth nakshatra {y.birthNakshatra}).
      </p>

      <h3 className="dasha-heading">Yogini Mahadasha</h3>
      <table className="dasha-table">
        <thead>
          <tr>
            <th>Yogini</th>
            <th>Lord</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {y.periods.map((p, i) => {
            const cur = inRange(p.startTime, p.endTime);
            return (
              <tr key={`${p.yogini}-${i}`} className={cur ? "dasha-current" : ""}>
                <td>
                  {p.yogini}
                  {cur && <span className="dasha-badge">● Current</span>}
                </td>
                <td>{p.lord}</td>
                <td>{formatDate(p.startTime)}</td>
                <td>{formatDate(p.endTime)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {current && antars.length > 0 && (
        <>
          <h3 className="dasha-heading">Antar-Yogini · within {current.yogini}</h3>
          <table className="dasha-table">
            <thead>
              <tr>
                <th>Sub-period</th>
                <th>Lord</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {antars.map((a, i) => {
                const cur = inRange(a.startTime, a.endTime);
                return (
                  <tr key={`${a.yogini}-${i}`} className={cur ? "dasha-current" : ""}>
                    <td>
                      {current.yogini} › {a.yogini}
                      {cur && <span className="dasha-badge">● Current</span>}
                    </td>
                    <td>{a.lord}</td>
                    <td>{formatDate(a.startTime)}</td>
                    <td>{formatDate(a.endTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
