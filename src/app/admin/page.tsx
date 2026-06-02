"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, MapPin, Hash, Truck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Stats = {
  shippingMethods: number;
  territories: number;
  counties: number;
  zipCodes: number;
  recentLogs: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { name: string };
    oldValue?: { territory?: string; county?: string };
    newValue?: { territory?: string; county?: string };
  }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Shipping Intelligence Platform overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Truck}
          label="Shipping Methods"
          value={stats?.shippingMethods}
          href="/admin/shipping-methods"
        />
        <StatCard icon={Layers} label="Territories" value={stats?.territories} href="/admin/territories" />
        <StatCard icon={MapPin} label="Counties" value={stats?.counties} href="/admin/map" />
        <StatCard icon={Hash} label="ZIP Codes" value={stats?.zipCodes} href="/admin/zipcodes" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Changes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/audit">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(stats?.recentLogs ?? []).map((log) => (
              <li key={log.id} className="text-sm border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{log.user?.name ?? "System"}</span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(log.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">
                  {log.action} {log.entityType}
                  {log.oldValue?.county && `: ${log.oldValue.county}`}
                  {log.oldValue?.territory && log.newValue?.territory && (
                    <> — {log.oldValue.territory} → {log.newValue.territory}</>
                  )}
                </p>
              </li>
            ))}
            {!stats?.recentLogs?.length && (
              <p className="text-muted-foreground text-sm">No recent changes</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value ?? "—"}</p>
        <Button variant="link" className="px-0 mt-2" asChild>
          <Link href={href}>Manage</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
