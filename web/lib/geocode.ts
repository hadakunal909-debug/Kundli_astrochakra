// Server-only geocoding: OpenStreetMap Nominatim (primary) with Open-Meteo fallback.
// No API key required. Module-level cache + throttle live per server instance.
import type { GeocodeResult } from "./types";

const USER_AGENT = "Astrochakra-Kundli/1.0 (hada.k@northeastern.edu)";
const MIN_NOMINATIM_INTERVAL_MS = 1100; // respect ~1 req/sec policy
const CACHE_MAX = 300;

const cache = new Map<string, GeocodeResult[]>();
let lastNominatimCall = 0;

function cacheGet(key: string): GeocodeResult[] | undefined {
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

function cacheSet(key: string, value: GeocodeResult[]): void {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fromNominatim(q: string): Promise<GeocodeResult[]> {
  const wait = MIN_NOMINATIM_INTERVAL_MS - (Date.now() - lastNominatimCall);
  if (wait > 0) await sleep(wait);
  lastNominatimCall = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return data
    .map((d) => ({
      lat: Number(d.lat),
      lon: Number(d.lon),
      label: d.display_name,
    }))
    .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lon));
}

async function fromOpenMeteo(q: string): Promise<GeocodeResult[]> {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=" +
    encodeURIComponent(q);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
      timezone?: string;
    }>;
  };
  return (data.results ?? []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    timezone: r.timezone,
  }));
}

/** Look up place candidates for a free-text query. Returns [] when too short or on failure. */
export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = q.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  let results: GeocodeResult[] = [];
  try {
    results = await fromNominatim(q);
  } catch {
    /* primary failed → try fallback */
  }
  if (results.length === 0) {
    try {
      results = await fromOpenMeteo(q);
    } catch {
      /* both failed */
    }
  }

  cacheSet(key, results);
  return results;
}
