import type { KundliResponse } from "@/lib/types";

function Card({
  title,
  present,
  presentLabel,
  children,
}: {
  title: string;
  present: boolean;
  presentLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dosha-card">
      <div className="dosha-card-head">
        <span className="dosha-title">{title}</span>
        <span className={`dosha-status ${present ? "is-present" : "is-absent"}`}>
          {present ? presentLabel ?? "Present" : "Not present"}
        </span>
      </div>
      <div className="dosha-body">{children}</div>
    </div>
  );
}

const ord = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function Doshas({ data }: { data: KundliResponse }) {
  const d = data.kundli.doshas;
  if (!d) return <p className="meta-line">Dosha analysis is not available for this chart.</p>;

  const { mangal, kalsarpa, sadeSati } = d;
  const both = mangal.fromLagna && mangal.fromMoon;

  return (
    <div className="dosha-list">
      <Card
        title="Mangal (Manglik) Dosha"
        present={mangal.present}
        presentLabel={both ? "Present (strong)" : "Present"}
      >
        {mangal.present ? (
          <p>
            Mars sits in the {ord(mangal.houseFromLagna)} house from your Ascendant
            {mangal.fromMoon ? ` and the ${ord(mangal.houseFromMoon)} house from the Moon` : ""},
            which forms Mangal Dosha
            {both ? " from both references, making it more pronounced" : ""}. This adds
            intensity and drive to marriage and partnerships and can bring friction or
            delays. It is traditionally checked during match-making, softens with age,
            and is considered cancelled when both partners share it or suitable remedies
            are followed.
          </p>
        ) : (
          <p>
            Mars does not fall in a Manglik house (1, 2, 4, 7, 8 or 12) from either your
            Ascendant or the Moon, so Mangal Dosha is not present in your chart.
          </p>
        )}
      </Card>

      <Card title="Kalsarpa Yoga" present={kalsarpa.present}>
        {kalsarpa.present ? (
          <p>
            All seven planets are hemmed on one side of the Rahu–Ketu axis, forming{" "}
            <strong>{kalsarpa.type} Kalsarpa Yoga</strong> (Rahu in your{" "}
            {ord(kalsarpa.rahuHouse ?? 1)} house). This can bring cycles of ups and downs
            and a sense of unseen obstacles, but it often turns into notable achievement
            once effort is applied steadily and patiently.
          </p>
        ) : (
          <p>
            Your planets are not entirely confined to one side of the Rahu–Ketu axis, so
            Kalsarpa Yoga is not formed in your chart.
          </p>
        )}
      </Card>

      <Card
        title="Sade Sati (Saturn Cycle)"
        present={sadeSati.active}
        presentLabel={`Active · ${sadeSati.phaseName} phase`}
      >
        {sadeSati.active ? (
          <p>
            Saturn is currently in <strong>{sadeSati.saturnSign}</strong>, the{" "}
            {sadeSati.phaseName?.toLowerCase()} phase of your Sade Sati — the roughly
            seven-and-a-half year Saturn passage around your Moon sign (
            {sadeSati.moonSign}). It is a maturing period that rewards hard work,
            patience and responsibility; shortcuts tend to backfire, but disciplined
            effort builds lasting results.
          </p>
        ) : (
          <p>
            Saturn is in {sadeSati.saturnSign} and is not transiting the signs around your
            Moon ({sadeSati.moonSign}), so you are not currently under Sade Sati.
            {sadeSati.dhaiya?.active
              ? ` However, the smaller Saturn cycle (Dhaiya / ${sadeSati.dhaiya.type} house) is active, a milder period of extra responsibility.`
              : ""}
          </p>
        )}
      </Card>
    </div>
  );
}
