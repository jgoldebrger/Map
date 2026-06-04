import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

const bulkAssignSchema = z.object({
  zips: z.array(z.string()).min(1).max(2000),
  territoryId: z.string().min(1),
});

const clearSchema = z.object({
  zips: z.array(z.string()).min(1).max(2000),
});

function normalizeZips(zips: string[]): string[] {
  return [
    ...new Set(
      zips
        .map((z) => z.replace(/\D/g, "").slice(0, 5).padStart(5, "0"))
        .filter((z) => z.length === 5),
    ),
  ];
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "county:assign")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.zipCodeAssignment.findMany({
    include: {
      zipCode: { select: { zip: true, city: true, county: { select: { name: true, state: true } } } },
      territory: {
        select: {
          id: true,
          name: true,
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
      color: string;
      shipDay: string | null;
      cutoffDay: string | null;
      notes: string | null;
      shippingMethod: string;
    }
  > = {};

  for (const row of rows) {
    map[row.zipCode.zip] = {
      territoryId: row.territory.id,
      territoryName: row.territory.name,
      color: row.territory.color,
      shipDay: row.territory.shipDay,
      cutoffDay: row.territory.cutoffDay,
      notes: row.territory.notes,
      shippingMethod: row.territory.shippingMethod.name,
    };
  }

  return NextResponse.json(map);
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

    const { territoryId } = parsed.data;
    const normalizedZips = normalizeZips(parsed.data.zips);
    if (normalizedZips.length === 0) {
      return NextResponse.json({ error: "No valid ZIP codes" }, { status: 400 });
    }

    const territory = await prisma.territory.findUnique({ where: { id: territoryId } });
    if (!territory) {
      return NextResponse.json({ error: "Territory not found" }, { status: 404 });
    }

    const zipRecords = await prisma.zipCode.findMany({
      where: { zip: { in: normalizedZips } },
      include: {
        assignment: { include: { territory: { select: { name: true } } } },
        county: { select: { name: true, state: true } },
      },
    });

    if (zipRecords.length === 0) {
      return NextResponse.json({ error: "No matching ZIP codes found" }, { status: 404 });
    }

    const createIds: string[] = [];
    const updateIds: string[] = [];
    for (const record of zipRecords) {
      if (record.assignment) updateIds.push(record.id);
      else createIds.push(record.id);
    }

    await prisma.$transaction(async (tx) => {
      if (updateIds.length > 0) {
        await tx.zipCodeAssignment.updateMany({
          where: { zipCodeId: { in: updateIds } },
          data: { territoryId },
        });
      }
      if (createIds.length > 0) {
        await tx.zipCodeAssignment.createMany({
          data: createIds.map((zipCodeId) => ({ zipCodeId, territoryId })),
        });
      }
    });

    const isSingle = zipRecords.length === 1;
    const zip = zipRecords[0];
    await writeAuditLog({
      userId: session.user.id,
      action: isSingle ? "ZIP_ASSIGN" : "ZIP_BULK_ASSIGN",
      entityType: "ZipCode",
      entityId: isSingle ? zip.id : territoryId,
      oldValue: isSingle
        ? {
            zip: zip.zip,
            territory: zip.assignment?.territory?.name ?? null,
            county: `${zip.county.name}, ${zip.county.state}`,
          }
        : { zipCount: zipRecords.length },
      newValue: isSingle
        ? { zip: zip.zip, territory: territory.name, override: true }
        : {
            territory: territory.name,
            zipCount: zipRecords.length,
            zipSample: zipRecords.slice(0, 25).map((z) => z.zip),
          },
    });

    return NextResponse.json({ updated: zipRecords.length });
  } catch (error) {
    console.error("PATCH /api/zipcodes/assignments failed:", error);
    return NextResponse.json({ error: "ZIP assignment failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !hasPermission(session.user.role, "county:assign")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = clearSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const normalizedZips = normalizeZips(parsed.data.zips);
    if (normalizedZips.length === 0) {
      return NextResponse.json({ error: "No valid ZIP codes" }, { status: 400 });
    }

    const zipRecords = await prisma.zipCode.findMany({
      where: { zip: { in: normalizedZips }, assignment: { isNot: null } },
      include: {
        assignment: { include: { territory: { select: { name: true } } } },
        county: { select: { name: true, state: true } },
      },
    });

    if (zipRecords.length === 0) {
      return NextResponse.json({ cleared: 0 });
    }

    await prisma.zipCodeAssignment.deleteMany({
      where: { zipCodeId: { in: zipRecords.map((z) => z.id) } },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: zipRecords.length === 1 ? "ZIP_CLEAR_OVERRIDE" : "ZIP_BULK_CLEAR_OVERRIDE",
      entityType: "ZipCode",
      entityId: zipRecords.length === 1 ? zipRecords[0].id : "bulk",
      oldValue:
        zipRecords.length === 1
          ? {
              zip: zipRecords[0].zip,
              territory: zipRecords[0].assignment?.territory?.name ?? null,
            }
          : { zipCount: zipRecords.length },
      newValue: { override: false },
    });

    return NextResponse.json({ cleared: zipRecords.length });
  } catch (error) {
    console.error("DELETE /api/zipcodes/assignments failed:", error);
    return NextResponse.json({ error: "Failed to clear ZIP overrides." }, { status: 500 });
  }
}
