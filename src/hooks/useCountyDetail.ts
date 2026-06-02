"use client";

import { useQuery } from "@tanstack/react-query";

export type CountyDetail = {
  county: string;
  state: string;
  fipsCode: string;
  territory: string | null;
  shippingMethod: string | null;
  shipDay: string | null;
  cutoffDay: string | null;
  notes: string | null;
  color: string | null;
};

export function normalizeFips(fips: string): string {
  return fips.padStart(5, "0").slice(-5);
}

async function fetchCountyDetail(fips: string): Promise<CountyDetail> {
  const code = normalizeFips(fips);
  const res = await fetch(`/api/counties/${code}`);
  if (!res.ok) throw new Error("County not found");
  return res.json();
}

export function useCountyDetail(fips: string | null) {
  return useQuery({
    queryKey: ["county", fips ? normalizeFips(fips) : null],
    queryFn: () => fetchCountyDetail(fips!),
    enabled: !!fips,
  });
}
