import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const results = await geocodePlace(q);
  return NextResponse.json(results);
}
