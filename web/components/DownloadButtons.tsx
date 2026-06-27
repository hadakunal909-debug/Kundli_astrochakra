"use client";

import { useRouter } from "next/navigation";
import type { KundliResponse } from "@/lib/types";

export default function DownloadButtons({ data }: { data: KundliResponse }) {
  const router = useRouter();
  void data;
  return (
    <button className="btn-primary download-report" onClick={() => router.push("/report?print=1")}>
      ⬇ Download Report
    </button>
  );
}
