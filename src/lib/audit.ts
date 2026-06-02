import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue ?? Prisma.JsonNull,
      newValue: params.newValue ?? Prisma.JsonNull,
    },
  });
}
