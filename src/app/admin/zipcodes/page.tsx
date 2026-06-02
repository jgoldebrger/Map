"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

type ZipRow = {
  zip: string;
  city: string;
  county: { name: string; state: string };
};

export default function ZipCodesPage() {
  const [zips, setZips] = useState<ZipRow[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedQ]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    params.set("page", String(pageIndex + 1));
    params.set("limit", String(pageSize));

    fetch(`/api/zipcodes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setZips(data.zips ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedQ, pageIndex, pageSize]);

  const columns = useMemo<DataTableColumn<ZipRow>[]>(
    () => [
      {
        id: "zip",
        header: "ZIP",
        accessor: (z) => z.zip,
        cell: (z) => <span className="font-mono">{z.zip}</span>,
      },
      {
        id: "city",
        header: "City",
        accessor: (z) => z.city,
      },
      {
        id: "county",
        header: "County",
        accessor: (z) => z.county.name,
      },
      {
        id: "state",
        header: "State",
        accessor: (z) => z.county.state,
      },
    ],
    [],
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ZIP Codes</h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `${total.toLocaleString()} ZIP codes in the database. Use search to narrow results, then paginate through all matches.`
            : "No ZIP codes loaded yet. Run npm run import:zips to import."}
        </p>
      </div>

      <DataTable
        data={zips}
        columns={columns}
        getRowId={(z) => z.zip}
        loading={loading}
        storageKey="zipcodes"
        emptyMessage="No ZIP codes found."
        showGlobalFilter={false}
        showColumnFilters={false}
        serverPagination
        totalRows={total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        toolbarLeft={
          <Input
            placeholder="Search ZIP or city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs h-9"
          />
        }
      />
    </div>
  );
}
