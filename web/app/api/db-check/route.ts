import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/supabase";

// Temporary diagnostic: confirms the deployed build can reach Supabase. Returns only
// booleans + any error message — never the secret key. Safe to remove once saving is
// confirmed working.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
