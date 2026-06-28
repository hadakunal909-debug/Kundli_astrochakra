"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadResult } from "@/lib/api-client";
import type { KundliResponse } from "@/lib/types";
import ReportCover from "@/components/report/ReportCover";
import PremiumReport from "@/components/premium/PremiumReport";

export default function PremiumPage() {
  const [data, setData] = useState<KundliResponse | null>(null);
  const [ready, setReady] = useState(false);
  const printed = useRef(false);

  useEffect(() => {
    const r = loadResult();
    setData(r);
    setReady(true);
    if (
      r &&
      !printed.current &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("print") === "1"
    ) {
      printed.current = true;
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
          <Link className="btn-ghost" href="/">← Back to form</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container report">
      <div className="toolbar no-print">
        <Link className="btn-ghost" href="/result">← Back</Link>
        <button className="btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <ReportCover data={data} />

      <section className="report-section">
        <h2 className="section-title">Premium Astrology Report</h2>
        <PremiumReport data={data} />
      </section>
    </main>
  );
}
