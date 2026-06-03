import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const q = request.nextUrl.searchParams.get("q");
  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1, 10_000);
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 25, 500);

  const where = q
    ? {
        OR: [
          { zip: { startsWith: q.replace(/\D/g, "") } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [zips, total] = await Promise.all([
    prisma.zipCode.findMany({
      where,
      include: { county: { select: { name: true, state: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { zip: "asc" },
    }),
    prisma.zipCode.count({ where }),
  ]);

  return NextResponse.json({ zips, total, page, limit });
}
