"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn, type SortState } from "@/components/ui/data-table";
import { AdminPage } from "@/components/layout/AdminPage";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";

type ZipRow = {
  zip: string;
  city: string;
  county: { name: string; state: string };
};

const COLUMN_FILTER_KEYS = ["zip", "city", "county", "state"] as const;

export default function ZipCodesPage() {
  const [zips, setZips] = useState<ZipRow[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>({ id: "zip", desc: false });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedColumnFilters(columnFilters), 300);
    return () => clearTimeout(t);
  }, [columnFilters]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedQ, debouncedColumnFilters, sort]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    params.set("page", String(pageIndex + 1));
    params.set("limit", String(pageSize));
    if (sort) {
      params.set("sortBy", sort.id);
      params.set("sortDir", sort.desc ? "desc" : "asc");
    }
    for (const key of COLUMN_FILTER_KEYS) {
      const value = debouncedColumnFilters[key]?.trim();
      if (value) params.set(`filter${key.charAt(0).toUpperCase()}${key.slice(1)}`, value);
    }

    fetch(`/api/zipcodes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setZips(data.zips ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedQ, debouncedColumnFilters, sort, pageIndex, pageSize]);

  const handleColumnFiltersChange = useCallback((filters: Record<string, string>) => {
    setColumnFilters(filters);
  }, []);

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
    <AdminPage>
      <AdminPageHeader
        title="ZIP Codes"
        description={
          total > 0
            ? `${total.toLocaleString()} ZIP codes in the database. Search and paginate through matches.`
            : "No ZIP codes loaded yet. Run import to populate."
        }
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <DataTable
        data={zips}
        columns={columns}
        getRowId={(z) => z.zip}
        loading={loading}
        storageKey="zipcodes"
        emptyMessage="No ZIP codes found."
        showGlobalFilter={false}
        showColumnFilters
        serverPagination
        serverSort
        sort={sort}
        onSortChange={setSort}
        serverColumnFilters
        columnFilters={columnFilters}
        onColumnFiltersChange={handleColumnFiltersChange}
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
    </AdminPage>
  );
}
