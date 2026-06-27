import type { KundliResponse } from "@/lib/types";
import { getFriendship } from "@/lib/strengths";

const ABBR: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa",
};

function cls(rel: string): string {
  if (rel.includes("Great Friend")) return "fr-gfriend";
  if (rel === "Friend") return "fr-friend";
  if (rel.includes("Great Enemy")) return "fr-genemy";
  if (rel === "Enemy") return "fr-enemy";
  if (rel === "Neutral") return "fr-neutral";
  return "";
}

export default function FriendshipTable({ data }: { data: KundliResponse }) {
  const { planets, matrix } = getFriendship(data);
  return (
    <div>
      <p className="meta-line">
        Compound (Panchadha) friendship — natural and temporary relationships combined.
        Read each row as how that planet regards the others.
      </p>
      <div className="av-scroll">
        <table className="av-table fr-table">
          <thead>
            <tr>
              <th>Planet</th>
              {planets.map((p) => (
                <th key={p}>{ABBR[p]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planets.map((a) => (
              <tr key={a}>
                <td className="av-planet">{a}</td>
                {planets.map((b) => (
                  <td key={b} className={cls(matrix[a][b])}>
                    {a === b ? "—" : matrix[a][b]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
