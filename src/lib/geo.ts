import { City, Country, State } from "country-state-city";

// Country, state and city lists for address dropdowns. The dataset is large, so it stays on the
// server: pages receive the short country list and the browser asks /api/geo for the rest.

export type GeoOption = { code: string; name: string };

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** Countries offered at checkout, in the order the store listed them. Empty list = every country. */
export function shippingCountries(allowed: string[]): GeoOption[] {
  const codes = allowed.map((code) => code.trim().toUpperCase()).filter(Boolean);
  const all = Country.getAllCountries().map((c) => ({ code: c.isoCode, name: c.name }));
  if (codes.length === 0) return all.sort(byName);
  return codes.flatMap((code) => all.filter((c) => c.code === code));
}

export function statesOf(countryCode: string): GeoOption[] {
  return State.getStatesOfCountry(countryCode)
    .map((s) => ({ code: s.isoCode, name: s.name }))
    .sort(byName);
}

export function citiesOf(countryCode: string, stateCode: string): string[] {
  const names = City.getCitiesOfState(countryCode, stateCode).map((c) => c.name);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Turns a phone number as typed into international format, using the address country for the prefix. */
export function toInternationalPhone(phone: string, countryCode = "IN") {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (trimmed.startsWith("+")) return `+${digits}`;

  const dial = (Country.getCountryByCode(countryCode.toUpperCase())?.phonecode ?? "91").replace(/\D/g, "");
  const local = digits.replace(/^0+/, "");
  // Already includes the country prefix (e.g. 919876543210).
  if (local.startsWith(dial) && local.length > 10) return `+${local}`;
  return `+${dial}${local}`;
}
