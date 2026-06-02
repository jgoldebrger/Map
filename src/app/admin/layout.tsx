import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
