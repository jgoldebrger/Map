import zipcodes from "zipcodes";

/** Look up USPS-style city for a 5-digit ZIP (via zipcodes npm dataset). */
export function lookupZipCity(zip: string): string | undefined {
  const normalized = zip.replace(/\D/g, "").padStart(5, "0").slice(0, 5);
  if (normalized.length !== 5) return undefined;
  return zipcodes.lookup(normalized)?.city;
}

export function resolveZipCity(
  zip: string,
  csvCity?: string,
  countyName?: string,
): string {
  if (csvCity?.trim()) return csvCity.trim();
  return lookupZipCity(zip) ?? countyName ?? "";
}
