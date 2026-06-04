"use client";

import { useQuery } from "@tanstack/react-query";
import type { LookupResult } from "@/lib/services/lookup";

function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, "").padStart(5, "0").slice(0, 5);
}

async function fetchZipLookup(zip: string): Promise<LookupResult> {
  const code = normalizeZip(zip);
  const res = await fetch(`/api/lookup?type=zip&q=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("ZIP not found");
  return res.json();
}

export function useZipLookup(zip: string | null) {
  return useQuery({
    queryKey: ["zip-lookup", zip ? normalizeZip(zip) : null],
    queryFn: () => fetchZipLookup(zip!),
    enabled: !!zip,
  });
}
