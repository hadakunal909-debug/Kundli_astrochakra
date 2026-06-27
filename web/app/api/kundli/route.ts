import { NextResponse } from "next/server";
import {
  getKundli,
  Observer,
  getPanchangam,
  generateKundaliSVGNorthStyled,
  generateHoroscope,
} from "@prisri/jyotish";
import type { Panchangam } from "@prisri/jyotish";
import { resolveBirthInstant } from "@/lib/time";
import { geocodePlace } from "@/lib/geocode";
import type {
  KundliRequest,
  KundliResponse,
  Place,
  ApiError,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json<ApiError>({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: KundliRequest;
  try {
    body = (await request.json()) as KundliRequest;
  } catch {
    return bad("Invalid JSON body.");
  }

  const name = (body.name ?? "").trim() || "Native";
  const { date, time } = body;

  if (!date || !time) return bad("Birth date and time are required.");

  // Resolve the birth place to coordinates.
  let place: Place | undefined = body.place;
  if (!place) {
    const q = (body.placeQuery ?? "").trim();
    if (!q) return bad("A birth place is required.");
    const matches = await geocodePlace(q);
    if (matches.length === 0) {
      return bad(`Could not find a location for "${q}". Try a more specific place.`);
    }
    place = { lat: matches[0].lat, lon: matches[0].lon, label: matches[0].label };
  }

  if (
    !Number.isFinite(place.lat) ||
    !Number.isFinite(place.lon) ||
    Math.abs(place.lat) > 90 ||
    Math.abs(place.lon) > 180
  ) {
    return bad("Invalid birth coordinates.");
  }

  // Wall-clock local time → precise UTC instant (DST/historical aware).
  let resolved;
  try {
    resolved = resolveBirthInstant(place.lat, place.lon, date, time);
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not resolve the birth time.");
  }
  const { utcDate, ianaZone, offsetMinutes, warnings } = resolved;

  // Run the calculations.
  try {
    const observer = new Observer(place.lat, place.lon, 0);
    const config = {
      houseSystem: body.config?.houseSystem ?? "whole_sign",
      ayanamsa: body.config?.ayanamsa ?? "lahiri",
    } as const;

    const kundli = getKundli(utcDate, observer, config);

    // Override the library's birthDetails (it formats to Asia/Kolkata and derives
    // the offset from the server OS) with the authoritative resolved values.
    kundli.birthDetails.date = date;
    kundli.birthDetails.time = time;
    kundli.birthDetails.lat = place.lat;
    kundli.birthDetails.lon = place.lon;
    kundli.birthDetails.timezone = offsetMinutes;

    const svg = generateKundaliSVGNorthStyled(
      { ...kundli, title: `${name}'s Kundli` },
      600,
    );
    const predictionsMarkdown = generateHoroscope(kundli);

    let panchangam: Panchangam | undefined;
    try {
      panchangam = getPanchangam(utcDate, observer, {
        timezoneOffset: offsetMinutes,
      });
    } catch {
      warnings.push("Panchang details could not be computed for this location.");
    }

    const response: KundliResponse = {
      name,
      input: {
        localDate: date,
        localTime: time,
        place,
        ianaZone,
        utcOffsetMinutes: offsetMinutes,
        utcInstant: utcDate.toISOString(),
      },
      kundli,
      svg,
      predictionsMarkdown,
      panchangam,
      warnings: warnings.length ? warnings : undefined,
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error("Kundli generation failed:", e);
    return bad(
      e instanceof Error ? e.message : "Failed to generate the kundli.",
      500,
    );
  }
}
