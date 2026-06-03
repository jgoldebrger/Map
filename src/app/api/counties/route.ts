import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";

const bulkAssignSchema = z.object({
  fipsCodes: z.array(z.string()).min(1).max(4000),
  territoryId: z.string().min(1),
});

function normalizeFipsList(fipsCodes: string[]): string[] {
  return [...new Set(fipsCodes.map((f) => f.padStart(5, "0").slice(-5)))];
}

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
  try {
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

    const normalizedFips = normalizeFipsList(fipsCodes);
    const counties = await prisma.county.findMany({
      where: { fipsCode: { in: normalizedFips } },
      select: {
        id: true,
        name: true,
        fipsCode: true,
        assignment: { select: { territory: { select: { name: true } } } },
      },
    });

    if (counties.length === 0) {
      return NextResponse.json({ error: "No matching counties found" }, { status: 404 });
    }

    const createIds: string[] = [];
    const updateIds: string[] = [];
    for (const county of counties) {
      if (county.assignment) updateIds.push(county.id);
      else createIds.push(county.id);
    }

    await prisma.$transaction(
      async (tx) => {
        if (updateIds.length > 0) {
          await tx.countyAssignment.updateMany({
            where: { countyId: { in: updateIds } },
            data: { territoryId },
          });
        }
        if (createIds.length > 0) {
          await tx.countyAssignment.createMany({
            data: createIds.map((countyId) => ({ countyId, territoryId })),
          });
        }
      },
      { timeout: 30_000 },
    );

    const isSingle = counties.length === 1;
    const county = counties[0];
    await writeAuditLog({
      userId: session.user.id,
      action: isSingle ? "ASSIGN" : "BULK_ASSIGN",
      entityType: "County",
      entityId: isSingle ? county.id : territoryId,
      oldValue: isSingle
        ? {
            territory: county.assignment?.territory?.name ?? null,
            county: county.name,
            fips: county.fipsCode,
          }
        : { countyCount: counties.length },
      newValue: isSingle
        ? { territory: territory.name, county: county.name, fips: county.fipsCode }
        : {
            territory: territory.name,
            countyCount: counties.length,
            fipsSample: counties.slice(0, 25).map((c) => c.fipsCode),
          },
    });

    return NextResponse.json({ updated: counties.length });
  } catch (error) {
    console.error("PATCH /api/counties failed:", error);
    return NextResponse.json({ error: "Assignment failed. Try fewer counties at once." }, { status: 500 });
  }
}
