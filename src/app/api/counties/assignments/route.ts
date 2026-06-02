import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const assignments = await prisma.countyAssignment.findMany({
    include: {
      county: { select: { fipsCode: true, name: true, state: true } },
      territory: {
        select: {
          id: true,
          name: true,
          shippingMethodId: true,
          color: true,
          shipDay: true,
          cutoffDay: true,
          notes: true,
          shippingMethod: { select: { name: true } },
        },
      },
    },
  });

  const map: Record<
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
  > = {};

  for (const a of assignments) {
    map[a.county.fipsCode] = {
      territoryId: a.territory.id,
      territoryName: a.territory.name,
      shippingMethodId: a.territory.shippingMethodId,
      color: a.territory.color,
      shipDay: a.territory.shipDay,
      cutoffDay: a.territory.cutoffDay,
      notes: a.territory.notes,
      shippingMethod: a.territory.shippingMethod.name,
    };
  }

  return NextResponse.json(map, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
