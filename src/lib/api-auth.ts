import { NextResponse } from "next/server";
import { auth } from "./auth";
import { hasPermission, type Permission } from "./permissions";

/** Require a logged-in user with the given permission. Returns session or an error Response. */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasPermission(session.user.role, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
