import { requireAdminPermission } from "@/lib/require-admin-route";

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission("import:run");
  return children;
}
