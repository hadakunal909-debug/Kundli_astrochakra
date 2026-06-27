"use client";

import type { KundliResponse } from "@/lib/types";
import { buildD1, buildD1Houses } from "@/lib/jyotish-ui";
import ChartWithHouses from "./ChartWithHouses";

export default function ChartExplorer({ data }: { data: KundliResponse }) {
  return (
    <ChartWithHouses
      chartData={buildD1(data)}
      title="Lagna Chart (D1)"
      houses={buildD1Houses(data)}
      style="north"
    />
  );
}
