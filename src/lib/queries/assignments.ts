export type AssignmentMap = Record<
  string,
  {
    territoryId: string;
    territoryName: string;
    shippingMethodId: string;
    color: string;
    shipDay: string | null;
    cutoffDay: string | null;
    notes: string | null;
    shippingMethod: string;
  }
>;

export async function fetchAssignments(): Promise<AssignmentMap> {
  const res = await fetch("/api/counties/assignments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load assignments");
  return res.json();
}

export function assignmentFromTerritory(
  territory: {
    id: string;
    name: string;
    color: string;
    shipDay?: string | null;
    cutoffDay?: string | null;
    notes?: string | null;
    shippingMethodId?: string;
    shippingMethod: { id?: string; name: string };
  },
): AssignmentMap[string] {
  return {
    territoryId: territory.id,
    territoryName: territory.name,
    shippingMethodId: territory.shippingMethodId ?? territory.shippingMethod.id ?? "",
    color: territory.color,
    shipDay: territory.shipDay ?? null,
    cutoffDay: territory.cutoffDay ?? null,
    notes: territory.notes ?? null,
    shippingMethod: territory.shippingMethod.name,
  };
}

export function patchAssignmentMap(
  current: AssignmentMap,
  fipsCodes: string[],
  territory: Parameters<typeof assignmentFromTerritory>[0] | null,
): AssignmentMap {
  const next: AssignmentMap = { ...current };
  const entry = territory ? assignmentFromTerritory(territory) : null;
  for (const fips of fipsCodes) {
    const key = fips.padStart(5, "0").slice(-5);
    if (entry) next[key] = { ...entry };
    else delete next[key];
  }
  return next;
}

export function revertAssignmentMap(
  current: AssignmentMap,
  fipsCodes: string[],
  previousByFips: Record<string, AssignmentMap[string] | null | undefined>,
): AssignmentMap {
  const next: AssignmentMap = { ...current };
  for (const fips of fipsCodes) {
    const key = fips.padStart(5, "0").slice(-5);
    const prev = previousByFips[key];
    if (prev) next[key] = { ...prev };
    else delete next[key];
  }
  return next;
}

/** Stable key so Mapbox repaints when territory colors change on existing FIPS. */
export function shippingMethodsFromAssignments(
  assignments: AssignmentMap,
): { id: string; name: string }[] {
  const methods = new Map<string, string>();
  for (const entry of Object.values(assignments)) {
    if (entry.shippingMethodId) {
      methods.set(entry.shippingMethodId, entry.shippingMethod);
    }
  }
  return [...methods.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterAssignmentsByShippingMethod(
  assignments: AssignmentMap,
  methodId: string | null,
): AssignmentMap {
  if (!methodId) return assignments;
  return Object.fromEntries(
    Object.entries(assignments).filter(([, entry]) => entry.shippingMethodId === methodId),
  );
}

export function filterZipOverridesByShippingMethod<
  T extends {
    display: GeoJSON.FeatureCollection;
    hit: GeoJSON.FeatureCollection;
  },
>(data: T | null | undefined, methodId: string | null): T | null | undefined {
  if (!data || !methodId) return data;

  const keep = (feature: GeoJSON.Feature) => feature.properties?.shippingMethodId === methodId;

  return {
    ...data,
    display: {
      ...data.display,
      features: data.display.features.filter(keep),
    },
    hit: {
      ...data.hit,
      features: data.hit.features.filter(keep),
    },
  };
}

export function assignmentColorRevision(assignments: AssignmentMap): string {
  return Object.entries(assignments)
    .map(([fips, a]) => `${fips}:${a.territoryId}:${a.color}`)
    .sort()
    .join("|");
}

export function updateTerritoryInAssignmentMap(
  current: AssignmentMap,
  territoryId: string,
  updates: Partial<
    Pick<
      AssignmentMap[string],
      "color" | "territoryName" | "shipDay" | "cutoffDay" | "notes" | "shippingMethod"
    >
  >,
): AssignmentMap {
  let changed = false;
  const next: AssignmentMap = { ...current };
  for (const [fips, entry] of Object.entries(next)) {
    if (entry.territoryId === territoryId) {
      next[fips] = { ...entry, ...updates };
      changed = true;
    }
  }
  return changed ? { ...next } : current;
}
