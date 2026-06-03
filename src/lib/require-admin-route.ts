import { redirect } from "next/navigation";
import { auth } from "./auth";
import { hasPermission, type Permission } from "./permissions";

export async function requireAdminPermission(permission: Permission) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, permission)) {
    redirect("/admin");
  }
  return session;
}
