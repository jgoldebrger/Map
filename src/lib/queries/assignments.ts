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
  const next = { ...current };
  const entry = territory ? assignmentFromTerritory(territory) : null;
  for (const fips of fipsCodes) {
    const key = fips.padStart(5, "0").slice(-5);
    if (entry) next[key] = entry;
    else delete next[key];
  }
  return next;
}
