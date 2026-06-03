import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public probe — no sensitive data. Use for CI/monitoring instead of /api/stats. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch {
    return NextResponse.json({ ok: true, db: "unavailable" });
  }
}
