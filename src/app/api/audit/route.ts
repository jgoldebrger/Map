import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const entityType = request.nextUrl.searchParams.get("entityType");
  const limit = 50;

  const logs = await prisma.auditLog.findMany({
    where: entityType ? { entityType } : undefined,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.auditLog.count({
    where: entityType ? { entityType } : undefined,
  });

  return NextResponse.json({ logs, total, page, limit });
}
