import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";

const bulkAssignSchema = z.object({
  fipsCodes: z.array(z.string()).min(1),
  territoryId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const bbox = request.nextUrl.searchParams.get("bbox");
  const polygon = request.nextUrl.searchParams.get("polygon");

  if (polygon) {
    try {
      JSON.parse(polygon);
      const rows = await prisma.$queryRaw<{ fipsCode: string; id: string }[]>`
        SELECT c."fipsCode", c.id
        FROM "County" c
        WHERE c."fipsCode" IS NOT NULL
      `;
      return NextResponse.json(rows.map((r) => r.fipsCode));
    } catch {
      return NextResponse.json({ error: "Invalid polygon" }, { status: 400 });
    }
  }

  if (bbox) {
    const coords = bbox.split(",").map(Number);
    if (coords.length !== 4 || coords.some(Number.isNaN)) {
      return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
    }
    const counties = await prisma.county.findMany({
      select: { fipsCode: true },
    });
    return NextResponse.json(counties.map((c) => c.fipsCode));
  }

  const counties = await prisma.county.findMany({
    include: {
      assignment: { include: { territory: { include: { shippingMethod: true } } } },
    },
    take: 5000,
  });
  return NextResponse.json(counties);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "county:assign")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkAssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { fipsCodes, territoryId } = parsed.data;
  const territory = await prisma.territory.findUnique({ where: { id: territoryId } });
  if (!territory) {
    return NextResponse.json({ error: "Territory not found" }, { status: 404 });
  }

  const counties = await prisma.county.findMany({
    where: { fipsCode: { in: fipsCodes.map((f) => f.padStart(5, "0").slice(-5)) } },
    include: { assignment: { include: { territory: true } } },
  });

  await prisma.$transaction(async (tx) => {
    for (const county of counties) {
      const oldTerritory = county.assignment?.territory?.name;
      await tx.countyAssignment.upsert({
        where: { countyId: county.id },
        create: { countyId: county.id, territoryId },
        update: { territoryId },
      });
      await writeAuditLog({
        userId: session.user.id,
        action: "ASSIGN",
        entityType: "County",
        entityId: county.id,
        oldValue: { territory: oldTerritory, county: county.name, fips: county.fipsCode },
        newValue: { territory: territory.name, county: county.name, fips: county.fipsCode },
      });
    }
  });

  return NextResponse.json({ updated: counties.length });
}
