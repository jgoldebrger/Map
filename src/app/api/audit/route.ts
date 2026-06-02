import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
