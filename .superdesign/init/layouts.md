# Layout Components

Shared layout shells and navigation used across pages.

---

## Root Layout

**Path:** `src/app/layout.tsx`  
**Description:** App shell — HTML document, Inter font, global CSS, React Query provider.

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIP — Shipping Intelligence Platform",
  description: "Fabuwood unified shipping territory management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

---

## SiteHeader

**Path:** `src/components/layout/SiteHeader.tsx`  
**Description:** Public top nav — SIP logo, Map / Lookup / Admin links. Used on home, map (via MapPageContent), lookup.

```tsx
import Link from "next/link";
import { Map, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Map className="h-5 w-5 text-primary" />
          SIP
          <span className="text-muted-foreground font-normal text-sm hidden sm:inline">
            Shipping Intelligence Platform
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/map">
              <Map className="h-4 w-4 mr-1" />
              Map
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lookup">
              <Search className="h-4 w-4 mr-1" />
              Lookup
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <Settings className="h-4 w-4 mr-1" />
              Admin
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
```

---

## AdminSidebar

**Path:** `src/components/layout/AdminSidebar.tsx`  
**Description:** Left admin nav with permission-filtered links, active route highlighting, sign-out button.

```tsx
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
    <aside className="flex w-56 flex-col border-r bg-white h-full">
      <div className="p-4 border-b">
        <Link href="/admin" className="font-semibold text-sm">
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
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href || (href !== "/admin" && pathname.startsWith(href))
                ? "bg-primary/10 text-primary font-medium"
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
```

---

## Admin Layout

**Path:** `src/app/admin/layout.tsx`  
**Description:** Admin shell — sidebar + scrollable main area, auth gate.

```tsx
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
```

---

## Auth Layout

**Path:** `src/app/(auth)/layout.tsx`  
**Description:** Login pages — SessionProvider wrapper with Suspense fallback.

```tsx
import { Suspense } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">Loading...</div>
        }
      >
        {children}
      </Suspense>
    </SessionProvider>
  );
}
```
