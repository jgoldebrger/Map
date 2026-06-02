import { prisma } from "@/lib/prisma";

export type LookupResult = {
  territory: string;
  shippingMethod: string;
  shipDay: string | null;
  cutoffDay: string | null;
  notes: string | null;
  county?: string;
  state?: string;
  city?: string;
  zip?: string;
};

export async function lookupByZip(zip: string): Promise<LookupResult | null> {
  const zipRecord = await prisma.zipCode.findUnique({
    where: { zip: zip.padStart(5, "0").slice(-5) },
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
  if (!zipRecord?.county.assignment) return null;
  const t = zipRecord.county.assignment.territory;
  return {
    territory: t.name,
    shippingMethod: t.shippingMethod.name,
    shipDay: t.shipDay,
    cutoffDay: t.cutoffDay,
    notes: t.notes,
    county: zipRecord.county.name,
    state: zipRecord.county.state,
    city: zipRecord.city,
    zip: zipRecord.zip,
  };
}

export async function lookupByCounty(name: string, state?: string): Promise<LookupResult | null> {
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
  if (!county?.assignment) return null;
  const t = county.assignment.territory;
  return {
    territory: t.name,
    shippingMethod: t.shippingMethod.name,
    shipDay: t.shipDay,
    cutoffDay: t.cutoffDay,
    notes: t.notes,
    county: county.name,
    state: county.state,
  };
}

export async function lookupByCity(city: string, state?: string): Promise<LookupResult | null> {
  const zip = await prisma.zipCode.findFirst({
    where: {
      city: { contains: city, mode: "insensitive" },
      ...(state ? { county: { state: state.toUpperCase().slice(0, 2) } } : {}),
    },
    include: { county: true },
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
  return {
    territory: territory.name,
    shippingMethod: territory.shippingMethod.name,
    shipDay: territory.shipDay,
    cutoffDay: territory.cutoffDay,
    notes: territory.notes,
  };
}

export async function lookupByState(state: string): Promise<LookupResult[]> {
  const counties = await prisma.county.findMany({
    where: { state: state.toUpperCase().slice(0, 2) },
    include: {
      assignment: {
        include: { territory: { include: { shippingMethod: true } } },
      },
    },
    take: 1,
  });
  const county = counties[0];
  if (!county?.assignment) return [];
  const t = county.assignment.territory;
  return [
    {
      territory: t.name,
      shippingMethod: t.shippingMethod.name,
      shipDay: t.shipDay,
      cutoffDay: t.cutoffDay,
      notes: t.notes,
      state: county.state,
    },
  ];
}

export async function performLookup(type: string, query: string): Promise<LookupResult | LookupResult[] | null> {
  switch (type) {
    case "zip":
      return lookupByZip(query.replace(/\D/g, "").slice(0, 5));
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
