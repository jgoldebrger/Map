import Link from "next/link";
import { Map, Search, ArrowRight, Layers, Route, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Territory zones",
    description: "Color counties and ZIP overrides by shipping territory across the US.",
  },
  {
    icon: Truck,
    title: "Shipping methods",
    description: "Filter the live map and exports by CCDT, FT, truck, or common carrier.",
  },
  {
    icon: Route,
    title: "ZIP lookup",
    description: "Instant answers for dealers — territory, method, ship day, and cutoff.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 hero-gradient">
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Fabuwood logistics
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                One live map for every shipping method
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Replace static territory PDFs with a unified Shipping Intelligence Platform —
                nationwide counties, ZIP overrides, and method filters in one place.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild>
                  <Link href="/map">
                    <Map className="mr-2 h-5 w-5" />
                    View map
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/lookup">
                    <Search className="mr-2 h-5 w-5" />
                    ZIP lookup
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative rounded-2xl border bg-white p-2 shadow-xl">
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-4 rounded-lg border border-slate-200/80 bg-white/60 backdrop-blur-sm p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Live territory map
                  </p>
                  <p className="mt-2 text-sm font-semibold">Filter by shipping method</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      CCDT
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      FT
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Truck
                    </span>
                  </div>
                </div>
                <Map className="h-24 w-24 text-primary/20" />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-xl border shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
