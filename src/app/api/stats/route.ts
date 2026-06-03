import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const [shippingMethods, territories, counties, zipCodes, recentLogs] = await Promise.all([
    prisma.shippingMethod.count(),
    prisma.territory.count({ where: { active: true } }),
    prisma.county.count(),
    prisma.zipCode.count(),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ shippingMethods, territories, counties, zipCodes, recentLogs });
}
