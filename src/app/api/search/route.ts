import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchSchema } from "@/lib/validators/search";

export async function GET(request: NextRequest) {
  const parsed = searchSchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json([]);
  }

  const q = parsed.data.q;

  const [counties, zips, territories] = await Promise.all([
    prisma.county.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { fipsCode: { startsWith: q } },
        ],
      },
      include: { assignment: { include: { territory: true } } },
      take: 5,
    }),
    prisma.zipCode.findMany({
      where: {
        OR: [
          { zip: { startsWith: q.replace(/\D/g, "") } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { county: true },
      take: 5,
    }),
    prisma.territory.findMany({
      where: { name: { contains: q, mode: "insensitive" }, active: true },
      include: { shippingMethod: true },
      take: 5,
    }),
  ]);

  const results = [
    ...counties.map((c) => ({
      type: "county" as const,
      label: `${c.name}, ${c.state}`,
      sublabel: c.assignment?.territory.name,
      href: `/map?fips=${c.fipsCode}`,
      value: c.fipsCode,
    })),
    ...zips.map((z) => ({
      type: "zip" as const,
      label: z.zip,
      sublabel: `${z.city}, ${z.county.state}`,
      href: `/lookup?type=zip&q=${z.zip}`,
      value: z.zip,
    })),
    ...territories.map((t) => ({
      type: "territory" as const,
      label: t.name,
      sublabel: t.shippingMethod.name,
      href: `/map?territory=${t.id}`,
      value: t.id,
    })),
  ];

  return NextResponse.json(results.slice(0, 15));
}
