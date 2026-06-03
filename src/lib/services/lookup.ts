import { prisma } from "@/lib/prisma";

export type LookupResult = {
  territory: string;
  shippingMethod: string;
  shipDay: string | null;
  cutoffDay: string | null;
  notes: string | null;
  unassigned?: boolean;
  county?: string;
  state?: string;
  city?: string;
  zip?: string;
};

const UNASSIGNED_TERRITORY = "Not assigned";
const UNASSIGNED_METHOD = "—";

function fromTerritory(
  t: {
    name: string;
    shipDay: string | null;
    cutoffDay: string | null;
    notes: string | null;
    shippingMethod: { name: string };
  },
  location: Pick<LookupResult, "county" | "state" | "city" | "zip"> = {},
): LookupResult {
  return {
    territory: t.name,
    shippingMethod: t.shippingMethod.name,
    shipDay: t.shipDay,
    cutoffDay: t.cutoffDay,
    notes: t.notes,
    ...location,
  };
}

function unassignedLocation(
  location: Pick<LookupResult, "county" | "state" | "city" | "zip">,
): LookupResult {
  return {
    territory: UNASSIGNED_TERRITORY,
    shippingMethod: UNASSIGNED_METHOD,
    shipDay: null,
    cutoffDay: null,
    notes: null,
    unassigned: true,
    ...location,
  };
}

function parseCountyQuery(query: string): { name: string; state?: string } {
  const parts = query.split(",").map((s) => s.trim());
  const name = parts[0].replace(/\s+county$/i, "");
  return { name, state: parts[1] };
}

export async function lookupByZip(zip: string): Promise<LookupResult | null> {
  const normalized = zip.replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  if (normalized.length !== 5) return null;

  const zipRecord = await prisma.zipCode.findUnique({
    where: { zip: normalized },
    include: {
      county: {
        include: {
          assignment: {
            include: { territory: { include: { shippingMethod: true } } },
          },
        },
      },
    },
  });
  if (!zipRecord) return null;

  const location = {
    county: zipRecord.county.name,
    state: zipRecord.county.state,
    city: zipRecord.city,
    zip: zipRecord.zip,
  };

  if (!zipRecord.county.assignment) {
    return unassignedLocation(location);
  }

  return fromTerritory(zipRecord.county.assignment.territory, location);
}

export async function lookupByCounty(query: string): Promise<LookupResult | null> {
  const { name, state } = parseCountyQuery(query);
  const county = await prisma.county.findFirst({
    where: {
      name: { contains: name, mode: "insensitive" },
      ...(state ? { state: state.toUpperCase().slice(0, 2) } : {}),
    },
    include: {
      assignment: {
        include: { territory: { include: { shippingMethod: true } } },
      },
    },
  });
  if (!county) return null;

  const location = { county: county.name, state: county.state };
  if (!county.assignment) {
    return unassignedLocation(location);
  }

  return fromTerritory(county.assignment.territory, location);
}

export async function lookupByCity(city: string, state?: string): Promise<LookupResult | null> {
  const zip = await prisma.zipCode.findFirst({
    where: {
      city: { contains: city, mode: "insensitive" },
      ...(state ? { county: { state: state.toUpperCase().slice(0, 2) } } : {}),
    },
    include: { county: true },
    orderBy: { zip: "asc" },
  });
  if (!zip) return null;
  return lookupByZip(zip.zip);
}

export async function lookupByTerritory(name: string): Promise<LookupResult | null> {
  const territory = await prisma.territory.findFirst({
    where: { name: { contains: name, mode: "insensitive" }, active: true },
    include: { shippingMethod: true },
  });
  if (!territory) return null;
  return fromTerritory(territory);
}

export async function lookupByState(state: string): Promise<LookupResult[]> {
  const st = state.trim().toUpperCase().slice(0, 2);
  if (st.length !== 2) return [];

  const assignments = await prisma.countyAssignment.findMany({
    where: { county: { state: st } },
    include: {
      territory: { include: { shippingMethod: true } },
    },
  });

  const seen = new Set<string>();
  const results: LookupResult[] = [];
  for (const assignment of assignments) {
    if (seen.has(assignment.territoryId)) continue;
    seen.add(assignment.territoryId);
    results.push(fromTerritory(assignment.territory, { state: st }));
  }

  results.sort((a, b) => a.territory.localeCompare(b.territory));
  if (results.length > 0) return results;

  const county = await prisma.county.findFirst({ where: { state: st } });
  if (!county) return [];
  return [unassignedLocation({ state: st, county: county.name })];
}

export async function performLookup(
  type: string,
  query: string,
): Promise<LookupResult | LookupResult[] | null> {
  switch (type) {
    case "zip":
      return lookupByZip(query);
    case "county":
      return lookupByCounty(query);
    case "city": {
      const parts = query.split(",").map((s) => s.trim());
      return lookupByCity(parts[0], parts[1]);
    }
    case "territory":
      return lookupByTerritory(query);
    case "state":
      return lookupByState(query);
    default:
      return null;
  }
}

export function isEmptyLookupResult(
  result: LookupResult | LookupResult[] | null,
): boolean {
  return result == null || (Array.isArray(result) && result.length === 0);
}
