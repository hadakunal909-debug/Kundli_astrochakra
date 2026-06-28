"use client";

import { useRouter } from "next/navigation";
import type { KundliResponse } from "@/lib/types";

export default function DownloadButtons({ data }: { data: KundliResponse }) {
  const router = useRouter();
  void data;
  return (
    <div className="dl-group">
      <button
        className="btn-primary download-report"
        onClick={() => router.push("/premium?print=1")}
      >
        ★ Premium Report
      </button>
      <button
        className="btn-ghost download-report"
        onClick={() => router.push("/report?print=1")}
      >
        ⬇ Technical Report
      </button>
    </div>
  );
}
