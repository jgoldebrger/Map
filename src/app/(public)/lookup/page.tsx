"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lookupSchema, type LookupInput } from "@/lib/validators/lookup";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LookupResult } from "@/lib/services/lookup";
import { AskMapsFloat } from "@/components/lookup/AskMapsFloat";

function LookupPageContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<LookupResult | LookupResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LookupInput>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { type: "zip", query: "" },
  });

  const runLookup = useCallback(async (data: LookupInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/lookup?type=${data.type}&q=${encodeURIComponent(data.query)}`,
      );
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "No results found");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") ?? searchParams.get("query") ?? "";
    if (!q.trim()) return;

    const type = searchParams.get("type") ?? "zip";
    const parsed = lookupSchema.safeParse({ type, query: q });
    if (!parsed.success) return;

    form.reset(parsed.data);
    void runLookup(parsed.data);
  }, [searchParams, form, runLookup]);

  const onSubmit = async (data: LookupInput) => {
    await runLookup(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="hero-gradient flex-1">
        <div className="container mx-auto max-w-lg px-4 py-8 lg:py-10">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Dealer tools</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ZIP & territory lookup</h1>
            <p className="text-sm text-muted-foreground">
              Instant territory, shipping method, ship day, and cutoff for any ZIP or location.
            </p>
          </div>
        <Card className="rounded-xl border shadow-sm shadow-slate-200/60">
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>
              Search by ZIP, county, city, territory, or state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Search type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) => form.setValue("type", v as LookupInput["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zip">ZIP Code</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="territory">Territory</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Query</Label>
                <Input
                  placeholder={
                    form.watch("type") === "zip"
                      ? "e.g. 07652"
                      : form.watch("type") === "county" || form.watch("type") === "city"
                        ? "e.g. Bergen, NJ"
                        : "Enter search term..."
                  }
                  {...form.register("query")}
                />
                {form.formState.errors.query && (
                  <p className="text-sm text-destructive">{form.formState.errors.query.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Searching..." : "Look up"}
              </Button>
            </form>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            {result && !Array.isArray(result) && <ResultCard result={result} />}
            {Array.isArray(result) &&
              result.map((r, i) => <ResultCard key={`${r.territory}-${i}`} result={r} />)}
          </CardContent>
        </Card>
        <AskMapsFloat />
        </div>
      </main>
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="hero-gradient flex-1">
            <div className="container mx-auto max-w-lg px-4 py-8">
              <Card className="rounded-xl shadow-sm">
                <CardContent className="py-8 text-sm text-muted-foreground">Loading lookup…</CardContent>
              </Card>
            </div>
          </main>
        </div>
      }
    >
      <LookupPageContent />
    </Suspense>
  );
}

function ResultCard({ result }: { result: LookupResult }) {
  return (
    <div className="mt-6 rounded-xl border bg-white p-5 space-y-3 shadow-sm">
      {result.unassigned && (
        <p className="text-sm text-amber-700">
          This location is in the database but has no territory assignment yet.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {result.color && (
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border"
              style={{ backgroundColor: result.color }}
              aria-hidden
            />
          )}
          <span className="truncate text-sm font-semibold">{result.territory}</span>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">{result.shippingMethod}</Badge>
      </div>
      <Row label="Ship Day" value={result.shipDay ?? "—"} />
      <Row label="Cutoff Day" value={result.cutoffDay ?? "—"} />
      {result.county && <Row label="County" value={`${result.county}, ${result.state}`} />}
      {result.city && <Row label="City" value={result.city} />}
      {result.zip && <Row label="ZIP" value={result.zip} />}
      {result.zipOverride && (
        <p className="text-xs text-muted-foreground col-span-2 -mt-1">
          ZIP-specific territory override (differs from county default)
        </p>
      )}
      {result.notes && <Row label="Notes" value={result.notes} />}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}
