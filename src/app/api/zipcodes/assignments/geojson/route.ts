import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.zipCodeAssignment.findMany({
    include: {
      zipCode: { select: { zip: true, county: { select: { state: true, fipsCode: true } } } },
      territory: { select: { name: true, color: true, shippingMethodId: true } },
    },
  });

  const overrides = rows.map((r) => ({
    zip: r.zipCode.zip,
    state: r.zipCode.county.state,
    fips: r.zipCode.county.fipsCode,
    color: r.territory.color,
    territoryName: r.territory.name,
    shippingMethodId: r.territory.shippingMethodId,
  }));

  return NextResponse.json(
    { overrides },
    { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } },
  );
}
