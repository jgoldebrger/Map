import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { shippingMethodSchema } from "@/lib/validators/shipping-method";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requirePermission("audit:read");
  if ("error" in authResult) return authResult.error;

  const methods = await prisma.shippingMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { territories: true } },
    },
  });
  return NextResponse.json(methods);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = shippingMethodSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.shippingMethod.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "A shipping method with this name already exists" }, { status: 409 });
  }

  const method = await prisma.shippingMethod.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ShippingMethod",
    entityId: method.id,
    newValue: method,
  });

  return NextResponse.json(method, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = shippingMethodSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.name) {
    const duplicate = await prisma.shippingMethod.findFirst({
      where: {
        name: { equals: parsed.data.name, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "A shipping method with this name already exists" }, { status: 409 });
    }
  }

  const method = await prisma.shippingMethod.update({
    where: { id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description?.trim() || null }
        : {}),
      ...(parsed.data.sortOrder != null ? { sortOrder: parsed.data.sortOrder } : {}),
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ShippingMethod",
    entityId: id,
    oldValue: existing,
    newValue: method,
  });

  return NextResponse.json(method);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "territory:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const territoryCount = await prisma.territory.count({ where: { shippingMethodId: id } });
  if (territoryCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${territoryCount} territor${territoryCount === 1 ? "y uses" : "ies use"} this shipping method` },
      { status: 409 },
    );
  }

  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shippingMethod.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "ShippingMethod",
    entityId: id,
    oldValue: existing,
  });

  return NextResponse.json({ ok: true });
}
