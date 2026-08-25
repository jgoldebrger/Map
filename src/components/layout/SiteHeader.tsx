"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/lookup", label: "Lookup", icon: Search },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Map className="h-5 w-5 text-primary" />
          SIP
          <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
            Shipping Intelligence Platform
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(active && "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600")}
              >
                <Link href={href}>
                  <Icon className="mr-1 h-4 w-4" />
                  {label}
                </Link>
              </Button>
            );
          })}
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <Settings className="mr-1 h-4 w-4" />
              Admin
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
