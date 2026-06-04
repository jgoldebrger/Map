import { prisma } from "@/lib/prisma";

export type CountySearchResult = {
  fips: string;
  name: string;
  state: string;
  territoryName: string | null;
};

export async function findCountiesByName(
  name: string,
  state?: string,
): Promise<CountySearchResult[]> {
  const cleanName = name.replace(/\s+county$/i, "").trim();
  if (!cleanName) return [];

  const counties = await prisma.county.findMany({
    where: {
      name: { contains: cleanName, mode: "insensitive" },
      ...(state ? { state: state.toUpperCase().slice(0, 2) } : {}),
    },
    include: { assignment: { include: { territory: true } } },
    take: 5,
    orderBy: [{ state: "asc" }, { name: "asc" }],
  });

  return counties.map((c) => ({
    fips: c.fipsCode,
    name: c.name,
    state: c.state,
    territoryName: c.assignment?.territory.name ?? null,
  }));
}
