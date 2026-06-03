import { requireAdminPermission } from "@/lib/require-admin-route";

export default async function MapEditorLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission("county:assign");
  return children;
}
