import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase access. Uses the SERVICE ROLE key, so this module must
 * NEVER be imported from a client component — the key bypasses Row Level Security
 * and must stay on the server. The `server-only` import above turns any accidental
 * client import into a build error.
 *
 * Required env vars (set locally in web/.env.local and on the cPanel app):
 *   SUPABASE_URL                 e.g. https://xxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    the service_role secret (NOT the anon key)
 */

// `undefined` = not yet initialised, `null` = initialised but not configured.
let cached: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Not configured (e.g. local dev without credentials). Persistence is simply
    // skipped rather than crashing chart generation.
    cached = null;
    return null;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export interface BirthInputRecord {
  /** Display name entered by the user ("Native" when left blank). */
  name: string;
  /** Local wall-clock birth date at the place, "YYYY-MM-DD". */
  birthDate: string;
  /** Local wall-clock birth time at the place, "HH:mm". */
  birthTime: string;
  placeLabel: string;
  placeLat: number;
  placeLon: number;
  houseSystem: string;
  ayanamsa: string;
}

/**
 * Persist a single birth-input submission to the `birth_inputs` table.
 *
 * De-duplicated: a submission with the same person identity (name + birth date +
 * birth time + exact coordinates) is silently ignored, so the same chart isn't
 * stored twice. This relies on the `birth_inputs_identity_idx` UNIQUE index from
 * supabase/schema.sql; the DB enforces it even under concurrent requests.
 *
 * Never throws: a Supabase outage or misconfiguration logs a warning and returns
 * so it can't break chart generation.
 *
 * @returns `true` when a NEW row was inserted, `false` when skipped (duplicate, not
 *   configured, or error).
 */
export async function saveBirthInput(record: BirthInputRecord): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) return false; // not configured — skip silently

  try {
    const { data, error } = await supabase
      .from("birth_inputs")
      .upsert(
        {
          name: record.name,
          birth_date: record.birthDate,
          birth_time: record.birthTime,
          place_label: record.placeLabel,
          place_lat: record.placeLat,
          place_lon: record.placeLon,
          house_system: record.houseSystem,
          ayanamsa: record.ayanamsa,
        },
        {
          onConflict: "name,birth_date,birth_time,place_lat,place_lon",
          ignoreDuplicates: true, // ON CONFLICT DO NOTHING
        },
      )
      .select("id");
    if (error) {
      console.error("[supabase] saveBirthInput failed:", error.message);
      return false;
    }
    // Empty result => the row already existed and was skipped (a duplicate).
    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.error("[supabase] saveBirthInput threw:", e);
    return false;
  }
}

/**
 * Diagnostic for the /api/db-check route. Reports whether the env vars are present
 * at runtime and whether a real query against `birth_inputs` succeeds. NEVER returns
 * the secret itself — only booleans and any error message.
 */
export async function checkConnection(): Promise<{
  urlSet: boolean;
  keySet: boolean;
  ok: boolean;
  error?: string;
}> {
  const urlSet = !!process.env.SUPABASE_URL;
  const keySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = getClient();
  if (!supabase) {
    return {
      urlSet,
      keySet,
      ok: false,
      error: "Supabase client not configured — env vars missing at runtime.",
    };
  }

  try {
    const { error } = await supabase.from("birth_inputs").select("id").limit(1);
    if (error) return { urlSet, keySet, ok: false, error: error.message };
    return { urlSet, keySet, ok: true };
  } catch (e) {
    return {
      urlSet,
      keySet,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
