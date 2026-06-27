// DTOs shared between the API routes and the client. The heavy chart object reuses
// the library's own `Kundli` / `Panchangam` types (import type → erased at runtime,
// so the client bundle never pulls in the CJS library).
import type { Kundli, Panchangam } from "@prisri/jyotish";

export type HouseSystem = "whole_sign" | "equal_house" | "placidus";
export type Ayanamsa = "lahiri" | "raman" | "kp";

export interface Place {
  lat: number;
  lon: number;
  label: string;
}

/** A geocoding candidate returned by GET /api/geocode. */
export interface GeocodeResult extends Place {
  /** Optional IANA zone the geocoder reported (cross-check only). */
  timezone?: string;
}

export interface KundliConfigDTO {
  houseSystem?: HouseSystem;
  ayanamsa?: Ayanamsa;
}

export interface KundliRequest {
  name: string;
  /** Local wall-clock date at the birth place, "YYYY-MM-DD". NOT a UTC ISO string. */
  date: string;
  /** Local wall-clock time at the birth place, "HH:mm". */
  time: string;
  /** Preferred: a place the user picked from the autocomplete. */
  place?: Place;
  /** Fallback: a free-text place the server will geocode. */
  placeQuery?: string;
  config?: KundliConfigDTO;
}

export interface KundliResponse {
  name: string;
  input: {
    localDate: string;
    localTime: string;
    place: Place;
    /** Resolved IANA timezone for the birth coordinates, e.g. "Asia/Kolkata". */
    ianaZone: string;
    /** UTC offset (minutes) that applied at the birth instant (DST/historical aware). */
    utcOffsetMinutes: number;
    /** The resolved UTC instant fed to getKundli, as an ISO string. */
    utcInstant: string;
  };
  kundli: Kundli;
  svg: string;
  predictionsMarkdown: string;
  panchangam?: Panchangam;
  warnings?: string[];
}

export interface ApiError {
  error: string;
}
