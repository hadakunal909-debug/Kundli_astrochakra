import { DateTime } from "luxon";
import tzlookup from "tz-lookup";

export interface ResolvedInstant {
  /** The UTC Date to feed getKundli/getPanchangam. */
  utcDate: Date;
  /** IANA zone resolved from the birth coordinates. */
  ianaZone: string;
  /** UTC offset in minutes at the birth instant (east-positive, e.g. +330 for IST). */
  offsetMinutes: number;
  warnings: string[];
}

/**
 * Resolve a local wall-clock birth time at a given location into the precise UTC
 * instant required by the calculation library.
 *
 * The order matters: we first map coordinates → IANA zone (time-independent), then
 * let Luxon (backed by the platform tz database) compute the offset *for that exact
 * historical instant*, so DST and historical zone changes are honoured.
 *
 * @param lat  latitude in degrees
 * @param lon  longitude in degrees
 * @param date local wall-clock date "YYYY-MM-DD"
 * @param time local wall-clock time "HH:mm"
 */
export function resolveBirthInstant(
  lat: number,
  lon: number,
  date: string,
  time: string,
): ResolvedInstant {
  const warnings: string[] = [];

  const zone = tzlookup(lat, lon);

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch) throw new Error(`Invalid birth date "${date}" (expected YYYY-MM-DD).`);
  if (!timeMatch) throw new Error(`Invalid birth time "${time}" (expected HH:mm).`);

  const [, y, mo, d] = dateMatch;
  const [, h, mi] = timeMatch;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);

  if (hour > 23 || minute > 59) {
    throw new Error(`Invalid birth time "${time}".`);
  }

  const dt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0 },
    { zone },
  );

  if (!dt.isValid) {
    throw new Error(
      `Could not interpret the birth time in zone ${zone}: ${dt.invalidReason ?? "unknown"}` +
        (dt.invalidExplanation ? ` (${dt.invalidExplanation})` : ""),
    );
  }

  // Detect a DST spring-forward gap: the requested wall time doesn't exist, so Luxon
  // shifts it past the transition and the round-tripped clock time no longer matches.
  if (dt.hour !== hour || dt.minute !== minute) {
    warnings.push(
      `The entered time ${time} falls in a daylight-saving gap for ${zone}; it was adjusted to ${dt.toFormat(
        "HH:mm",
      )}. Verify the intended birth time.`,
    );
  }

  if (year < 1900) {
    warnings.push(
      `Births before 1900 rely on historical timezone data of limited precision; the resolved offset (${zone}) should be sanity-checked.`,
    );
  }

  return {
    utcDate: dt.toUTC().toJSDate(),
    ianaZone: zone,
    offsetMinutes: dt.offset,
    warnings,
  };
}

/** Format a minute offset as "UTC+05:30" / "UTC-08:00". */
export function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}
