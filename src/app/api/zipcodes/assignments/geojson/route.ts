import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildZipOverrideGeoJson, zctaDataAvailable } from "@/lib/zcta-geo";

export async function GET() {
  const rows = await prisma.zipCodeAssignment.findMany({
    include: {
      zipCode: { select: { zip: true, county: { select: { state: true } } } },
      territory: { select: { name: true, color: true } },
    },
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { type: "FeatureCollection", features: [] },
      { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } },
    );
  }

  const overrides = rows.map((r) => ({
    zip: r.zipCode.zip,
    state: r.zipCode.county.state,
    color: r.territory.color,
    territoryName: r.territory.name,
  }));

  const states = [...new Set(overrides.map((o) => o.state))];
  const geojson = buildZipOverrideGeoJson(overrides);

  return NextResponse.json(
    {
      ...geojson,
      meta: {
        overrideCount: overrides.length,
        renderedCount: geojson.features.length,
        zctaAvailable: zctaDataAvailable(states),
      },
    },
    { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } },
  );
}
