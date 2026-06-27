// tz-lookup ships no bundled types. It default-exports a single function that
// maps a (latitude, longitude) pair to an IANA timezone name.
declare module "tz-lookup" {
  export default function tzlookup(lat: number, lon: number): string;
}
