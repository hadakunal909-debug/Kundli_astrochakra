"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadResult } from "@/lib/api-client";
import type { KundliResponse } from "@/lib/types";
import ReportCover from "@/components/report/ReportCover";
import ReportTOC from "@/components/report/ReportTOC";
import BasicDetailsSection from "@/components/report/BasicDetailsSection";
import Charts from "@/components/Charts";
import DivisionalCharts from "@/components/DivisionalCharts";
import PlanetTable from "@/components/PlanetTable";
import DashaTimeline from "@/components/DashaTimeline";
import Ashtakavarga from "@/components/Ashtakavarga";
import Doshas from "@/components/Doshas";
import Numerology from "@/components/Numerology";
import Predictions from "@/components/Predictions";
import Remedies from "@/components/Remedies";
import Transit from "@/components/Transit";
import FriendshipTable from "@/components/FriendshipTable";
import ShodashvargaTable from "@/components/ShodashvargaTable";
import SpecialLagnas from "@/components/SpecialLagnas";
import BhavaChalit from "@/components/BhavaChalit";
import KpTable from "@/components/KpTable";
import JaiminiPanel from "@/components/JaiminiPanel";
import YoginiDasha from "@/components/YoginiDasha";
import Varshaphal from "@/components/Varshaphal";
import Shadbala from "@/components/Shadbala";
import LalKitab from "@/components/LalKitab";
import PanchangPanel from "@/components/PanchangPanel";

const SECTIONS = [
  "Basic Details & Avkahada Chakra",
  "Birth Charts (Lagna)",
  "Predictions",
  "Doshas",
  "Remedies",
  "Numerology",
  "Divisional Charts (D1–D60)",
  "Shodashvarga Table",
  "Planetary Positions",
  "Friendship Table",
  "Vimshottari Dasha",
  "Yogini Dasha",
  "Ashtakavarga",
  "Transit (Gochar)",
  "Jaimini System",
  "KP Significators",
  "Varshaphal (Annual)",
  "Shadbala (Strengths)",
  "Lal Kitab",
  "Panchang",
];

export default function ReportPage() {
  const [data, setData] = useState<KundliResponse | null>(null);
  const [ready, setReady] = useState(false);
  const printedRef = useRef(false);

  useEffect(() => {
    const result = loadResult();
    setData(result);
    setReady(true);

    if (
      result &&
      !printedRef.current &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("print") === "1"
    ) {
      printedRef.current = true;
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!ready) return <main className="container" />;

  if (!data) {
    return (
      <main className="container">
        <div className="card">
          <p>No kundli to display. Please generate one first.</p>
          <Link className="btn-ghost" href="/">
            ← Back to form
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="report">
      <div className="toolbar no-print report-toolbar">
        <Link className="btn-ghost" href="/result">
          ← Back
        </Link>
        <button className="btn-primary report-download" onClick={() => window.print()}>
          ⬇ Download Full Report (PDF)
        </button>
      </div>

      <ReportCover data={data} />

      <ReportTOC sections={SECTIONS} />

      <section className="report-section">
        <h2 className="section-title">Basic Details &amp; Avkahada Chakra</h2>
        <BasicDetailsSection data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Birth Charts</h2>
        <Charts data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Predictions</h2>
        <Predictions data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Doshas</h2>
        <Doshas data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Remedies</h2>
        <Remedies data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Numerology</h2>
        <Numerology data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Divisional Charts (D1–D60)</h2>
        <DivisionalCharts data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Shodashvarga Table</h2>
        <ShodashvargaTable data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Special Lagnas &amp; Upagrahas</h2>
        <SpecialLagnas data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Bhava Chalit &amp; Bhavat Bhavam</h2>
        <BhavaChalit data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Planetary Positions</h2>
        <PlanetTable data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Friendship Table</h2>
        <FriendshipTable data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Vimshottari Dasha</h2>
        <DashaTimeline data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Yogini Dasha</h2>
        <YoginiDasha data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Ashtakavarga</h2>
        <Ashtakavarga data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Transit (Gochar)</h2>
        <Transit data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Jaimini System</h2>
        <JaiminiPanel data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">KP Significators</h2>
        <KpTable data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Varshaphal (Annual)</h2>
        <Varshaphal data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Shadbala (Strengths)</h2>
        <Shadbala data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Lal Kitab</h2>
        <LalKitab data={data} />
      </section>

      <section className="report-section">
        <h2 className="section-title">Panchang</h2>
        <PanchangPanel data={data} />
      </section>

      <footer className="report-footer">
        Astrochakra · Vedic Janam Kundli · www.astrochakra.co
      </footer>
    </main>
  );
}
