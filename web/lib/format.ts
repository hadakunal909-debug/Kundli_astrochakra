/** Degrees-minutes within a sign, e.g. 48.67 → "18°40'". */
export function signDegree(longitude: number): string {
  const dec = ((longitude % 30) + 30) % 30;
  const deg = Math.floor(dec);
  const min = Math.floor((dec - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}'`;
}

// Parse a value into a Date. A plain "YYYY-MM-DD" string is treated as a local
// calendar date (NOT UTC midnight) so it never shifts across the browser's timezone.
function toDate(value: string | Date): Date {
  if (typeof value !== "string") return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** A date string/Date → "01 Jan 1990". Returns "—" for missing/invalid. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** A date string/Date → "01 Jan 1990, 14:30". Pass timeZone (e.g. "UTC") to pin the zone. */
export function formatDateTime(
  value: string | Date | null | undefined,
  timeZone?: string,
): string {
  if (!value) return "—";
  const d = toDate(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

/** A date/Date → "14:30" (used for sunrise/sunset, rendered in a given IANA zone). */
export function formatClock(
  value: string | Date | null | undefined,
  timeZone?: string,
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}
