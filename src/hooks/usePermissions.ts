"use client";

import { useSession } from "next-auth/react";
import { canWrite, hasPermission, type Permission } from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return {
    role,
    canWrite: role ? canWrite(role) : false,
    hasPermission: (permission: Permission) =>
      role ? hasPermission(role, permission) : false,
  };
}
