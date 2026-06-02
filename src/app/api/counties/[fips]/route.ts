import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fips: string }> }
) {
  const { fips } = await params;
  const fipsCode = fips.padStart(5, "0").slice(-5);

  const county = await prisma.county.findUnique({
    where: { fipsCode },
    include: {
      assignment: {
        include: { territory: { include: { shippingMethod: true } } },
      },
      zipCodes: { take: 10 },
    },
  });

  if (!county) {
    return NextResponse.json({ error: "County not found" }, { status: 404 });
  }

  const t = county.assignment?.territory;
  return NextResponse.json({
    county: county.name,
    state: county.state,
    fipsCode: county.fipsCode,
    territory: t?.name ?? null,
    shippingMethod: t?.shippingMethod.name ?? null,
    shipDay: t?.shipDay ?? null,
    cutoffDay: t?.cutoffDay ?? null,
    notes: t?.notes ?? null,
    color: t?.color ?? null,
    zipCodes: county.zipCodes,
  });
}
