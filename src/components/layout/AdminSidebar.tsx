"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  MapPin,
  Globe,
  FileUp,
  History,
  Layers,
  Truck,
  LogOut,
  Code2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

const allLinks: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/shipping-methods", label: "Shipping Methods", icon: Truck },
  { href: "/admin/territories", label: "Territories", icon: Layers },
  { href: "/admin/live-map", label: "Live Map", icon: Globe },
  { href: "/admin/export", label: "Map Export", icon: Download },
  {
    href: "/admin/map",
    label: "Map Editor",
    icon: Map,
    permission: "county:assign",
  },
  { href: "/admin/zipcodes", label: "ZIP Codes", icon: MapPin },
  {
    href: "/admin/import",
    label: "Import",
    icon: FileUp,
    permission: "import:run",
  },
  { href: "/admin/audit", label: "Audit Log", icon: History },
  { href: "/admin/embed", label: "Partner Embed", icon: Code2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { hasPermission, role } = usePermissions();

  const links = allLinks.filter(
    (link) => !link.permission || hasPermission(link.permission)
  );

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-white shadow-sm">
      <div className="border-b p-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-4 w-4" />
          </span>
          SIP Admin
        </Link>
        <p className="text-xs text-muted-foreground">Fabuwood Logistics</p>
        {role === "READ_ONLY" && (
          <p className="text-xs text-amber-600 mt-1">Read-only access</p>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-blue-50 font-medium text-blue-600"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
