import Link from "next/link";
import { Map, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Shipping Intelligence Platform
          </h1>
          <p className="text-lg text-muted-foreground">
            One unified nationwide map for all Fabuwood shipping methods and territories. No more
            static maps.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/map">
                <Map className="mr-2 h-5 w-5" />
                View Map
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/lookup">
                <Search className="mr-2 h-5 w-5" />
                ZIP Lookup
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
