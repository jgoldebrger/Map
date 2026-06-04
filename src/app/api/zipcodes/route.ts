import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

const SORT_COLUMNS = ["zip", "city", "county", "state"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

function parseSortColumn(value: string | null): SortColumn {
  if (value && SORT_COLUMNS.includes(value as SortColumn)) {
    return value as SortColumn;
  }
  return "zip";
}

function buildWhere(params: URLSearchParams): Prisma.ZipCodeWhereInput | undefined {
  const and: Prisma.ZipCodeWhereInput[] = [];

  const q = params.get("q")?.trim();
  if (q) {
    and.push({
      OR: [
        { zip: { startsWith: q.replace(/\D/g, "") } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const zip = params.get("filterZip")?.trim();
  if (zip) {
    and.push({ zip: { startsWith: zip.replace(/\D/g, "") } });
  }

  const city = params.get("filterCity")?.trim();
  if (city) {
    and.push({ city: { contains: city, mode: "insensitive" } });
  }

  const county = params.get("filterCounty")?.trim();
  if (county) {
    and.push({ county: { name: { contains: county, mode: "insensitive" } } });
  }

  const state = params.get("filterState")?.trim();
  if (state) {
    and.push({ county: { state: { equals: state.toUpperCase().slice(0, 2) } } });
  }

  const fips = params
    .get("filterFips")
    ?.split(",")
    .map((f) => f.trim().padStart(5, "0").slice(-5))
    .filter((f) => f.length === 5);
  if (fips && fips.length > 0) {
    and.push({ county: { fipsCode: { in: fips } } });
  }

  const territoryIds = params
    .get("filterTerritoryIds")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (territoryIds && territoryIds.length > 0) {
    and.push({ county: { assignment: { territoryId: { in: territoryIds } } } });
  }

  const overridesOnly = params.get("overridesOnly") === "1";
  if (overridesOnly) {
    and.push({ assignment: { isNot: null } });
  }

  if (and.length === 0) return undefined;
  if (and.length === 1) return and[0];
  return { AND: and };
}

function buildOrderBy(
  sortBy: SortColumn,
  sortDir: "asc" | "desc",
): Prisma.ZipCodeOrderByWithRelationInput {
  switch (sortBy) {
    case "city":
      return { city: sortDir };
    case "county":
      return { county: { name: sortDir } };
    case "state":
      return { county: { state: sortDir } };
    default:
      return { zip: sortDir };
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const params = request.nextUrl.searchParams;
  const includeOverrides = params.get("includeOverrides") === "1";
  const page = parsePositiveInt(params.get("page"), 1, 10_000);
  const limit = parsePositiveInt(params.get("limit"), 25, 500);
  const sortBy = parseSortColumn(params.get("sortBy"));
  const sortDir = params.get("sortDir") === "desc" ? "desc" : "asc";
  const where = buildWhere(params);

  const [zips, total] = await Promise.all([
    prisma.zipCode.findMany({
      where,
      include: {
        county: {
          select: {
            name: true,
            state: true,
            fipsCode: true,
            assignment: includeOverrides
              ? { include: { territory: { select: { id: true, name: true, color: true } } } }
              : false,
          },
        },
        ...(includeOverrides
          ? {
              assignment: {
                include: {
                  territory: {
                    select: { id: true, name: true, color: true, shippingMethod: { select: { name: true } } },
                  },
                },
              },
            }
          : {}),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortDir),
    }),
    prisma.zipCode.count({ where }),
  ]);

  const rows = includeOverrides
    ? zips.map((z) => {
        const record = z as typeof z & {
          assignment?: {
            territory: { id: string; name: string; color: string; shippingMethod: { name: string } };
          } | null;
          county: {
            name: string;
            state: string;
            fipsCode: string;
            assignment?: { territory: { id: string; name: string; color: string } } | null;
          };
        };
        return {
          zip: record.zip,
          city: record.city,
          county: { name: record.county.name, state: record.county.state },
          override: record.assignment
            ? {
                territoryId: record.assignment.territory.id,
                territoryName: record.assignment.territory.name,
                color: record.assignment.territory.color,
                shippingMethod: record.assignment.territory.shippingMethod.name,
              }
            : null,
          countyTerritory: record.county.assignment
            ? {
                territoryId: record.county.assignment.territory.id,
                territoryName: record.county.assignment.territory.name,
                color: record.county.assignment.territory.color,
              }
            : null,
        };
      })
    : zips;

  return NextResponse.json({ zips: rows, total, page, limit, sortBy, sortDir });
}
