import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { territorySchema } from "@/lib/validators/territory";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const territories = await prisma.territory.findMany({
    include: {
      shippingMethod: true,
      _count: { select: { assignments: true } },
    },
    orderBy: [{ shippingMethod: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return NextResponse.json(territories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = territorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const territory = await prisma.territory.create({ data: parsed.data });

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Territory",
    entityId: territory.id,
    newValue: territory,
  });

  return NextResponse.json(territory, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.territory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = territorySchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const territory = await prisma.territory.update({ where: { id }, data: parsed.data });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Territory",
    entityId: id,
    oldValue: existing,
    newValue: territory,
  });

  return NextResponse.json(territory);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const count = await prisma.countyAssignment.count({ where: { territoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} counties still assigned` },
      { status: 409 }
    );
  }

  const existing = await prisma.territory.findUnique({ where: { id } });
  await prisma.territory.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Territory",
    entityId: id,
    oldValue: existing ? { ...existing } : undefined,
  });

  return NextResponse.json({ ok: true });
}
