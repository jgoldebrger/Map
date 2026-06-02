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
