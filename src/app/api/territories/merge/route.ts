import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const mergeSchema = z.object({
  sourceTerritoryIds: z.array(z.string()).min(1),
  targetTerritoryId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = mergeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sourceTerritoryIds, targetTerritoryId } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.countyAssignment.updateMany({
      where: { territoryId: { in: sourceTerritoryIds } },
      data: { territoryId: targetTerritoryId },
    });

    await tx.territory.updateMany({
      where: { id: { in: sourceTerritoryIds } },
      data: { active: false },
    });

    return updated.count;
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "MERGE",
    entityType: "Territory",
    entityId: targetTerritoryId,
    newValue: { mergedFrom: sourceTerritoryIds, countiesMoved: result },
  });

  return NextResponse.json({ countiesMoved: result });
}
