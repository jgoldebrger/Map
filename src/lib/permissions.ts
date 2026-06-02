import { Role } from "@prisma/client";

export type Permission =
  | "territory:write"
  | "county:assign"
  | "zip:import"
  | "import:run"
  | "audit:read"
  | "user:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "territory:write",
    "county:assign",
    "zip:import",
    "import:run",
    "audit:read",
    "user:manage",
  ],
  LOGISTICS_MANAGER: [
    "territory:write",
    "county:assign",
    "zip:import",
    "import:run",
    "audit:read",
  ],
  READ_ONLY: ["audit:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canWrite(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "LOGISTICS_MANAGER";
}
