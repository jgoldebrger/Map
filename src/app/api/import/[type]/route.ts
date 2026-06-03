import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { territorySchema } from "@/lib/validators/territory";
import { writeAuditLog } from "@/lib/audit";

const MAX_CSV_CHARS = 2 * 1024 * 1024;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "import:run")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await params;
  const body = await request.json();
  const { csv, preview } = body as { csv: string; preview?: boolean };

  if (!csv) return NextResponse.json({ error: "CSV required" }, { status: 400 });
  if (csv.length > MAX_CSV_CHARS) {
    return NextResponse.json({ error: "CSV exceeds 2MB limit" }, { status: 413 });
  }

  const rows = parseCsv(csv);
  const errors: { row: number; message: string }[] = [];
  const validRows: unknown[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      switch (type) {
        case "territories": {
          const method = await prisma.shippingMethod.findFirst({
            where: { name: { equals: row.method ?? row.shippingmethod, mode: "insensitive" } },
          });
          if (!method) throw new Error(`Unknown method: ${row.method}`);
          const parsed = territorySchema.parse({
            name: row.name,
            shippingMethodId: method.id,
            color: row.color ?? "#94a3b8",
            shipDay: row.shipday || row.ship_day,
            cutoffDay: row.cutoffday || row.cutoff_day,
            notes: row.notes,
            active: row.active !== "false",
          });
          validRows.push(parsed);
          break;
        }
        case "counties": {
          const fips = (row.fips ?? row.fipscode ?? "").padStart(5, "0").slice(-5);
          const territory = await prisma.territory.findFirst({
            where: { name: { equals: row.territory, mode: "insensitive" } },
          });
          if (!territory) throw new Error(`Unknown territory: ${row.territory}`);
          validRows.push({ fips, territoryId: territory.id });
          break;
        }
        case "zips": {
          const zip = (row.zip ?? "").replace(/\D/g, "").padStart(5, "0").slice(0, 5);
          const county = await prisma.county.findFirst({
            where: {
              name: { contains: row.county, mode: "insensitive" },
              state: (row.state ?? "").toUpperCase().slice(0, 2),
            },
          });
          if (!county) throw new Error(`County not found: ${row.county}, ${row.state}`);
          validRows.push({ zip, city: row.city, countyId: county.id });
          break;
        }
        default:
          return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
      }
    } catch (e) {
      errors.push({ row: i + 2, message: e instanceof Error ? e.message : "Invalid row" });
    }
  }

  if (preview) {
    return NextResponse.json({ valid: validRows.length, errors, preview: validRows.slice(0, 10) });
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of validRows) {
        switch (type) {
          case "territories":
            await tx.territory.create({ data: item as Parameters<typeof tx.territory.create>[0]["data"] });
            break;
          case "counties": {
            const { fips, territoryId } = item as { fips: string; territoryId: string };
            const county = await tx.county.findUnique({ where: { fipsCode: fips } });
            if (county) {
              await tx.countyAssignment.upsert({
                where: { countyId: county.id },
                create: { countyId: county.id, territoryId },
                update: { territoryId },
              });
            }
            break;
          }
          case "zips": {
            const { zip, city, countyId } = item as { zip: string; city: string; countyId: string };
            await tx.zipCode.upsert({
              where: { zip },
              create: { zip, city, countyId },
              update: { city, countyId },
            });
            break;
          }
        }
      }
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Import failed — rolled back", message: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "IMPORT",
    entityType: type,
    entityId: "bulk",
    newValue: { rows: validRows.length },
  });

  return NextResponse.json({ imported: validRows.length });
}
