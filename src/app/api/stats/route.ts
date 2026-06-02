import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
