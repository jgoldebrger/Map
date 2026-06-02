"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lookupSchema, type LookupInput } from "@/lib/validators/lookup";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
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

export default function LookupPage() {
  const [result, setResult] = useState<LookupResult | LookupResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LookupInput>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { type: "zip", query: "" },
  });

  const onSubmit = async (data: LookupInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/lookup?type=${data.type}&q=${encodeURIComponent(data.query)}`
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Lookup</CardTitle>
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

            {result && !Array.isArray(result) && (
              <ResultCard result={result} />
            )}
            {Array.isArray(result) && result.map((r, i) => <ResultCard key={i} result={r} />)}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: LookupResult }) {
  return (
    <div className="mt-6 rounded-lg border bg-muted/30 p-4 space-y-2">
      <Row label="Territory" value={result.territory} highlight />
      <Row label="Shipping Method" value={result.shippingMethod} />
      <Row label="Ship Day" value={result.shipDay ?? "—"} />
      <Row label="Cutoff Day" value={result.cutoffDay ?? "—"} />
      {result.county && <Row label="County" value={`${result.county}, ${result.state}`} />}
      {result.city && <Row label="City" value={result.city} />}
      {result.zip && <Row label="ZIP" value={result.zip} />}
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
