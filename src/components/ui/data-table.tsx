"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  accessor?: (row: T) => string | number | boolean | null | undefined;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  defaultVisible?: boolean;
  /** Set false for action columns that must always show */
  enableHiding?: boolean;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  /** Persist column visibility in localStorage */
  storageKey?: string;
  globalFilterPlaceholder?: string;
  showGlobalFilter?: boolean;
  toolbarLeft?: ReactNode;
  /** Enable pagination UI (default true) */
  pagination?: boolean;
  /** Initial rows per page (default 25) */
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Fetch pages from the server; parent controls page index/size and passes one page of `data` */
  serverPagination?: boolean;
  /** Total row count in the database (required with serverPagination) */
  totalRows?: number;
  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /** Hide per-column filter inputs (recommended for server-paginated tables unless serverColumnFilters) */
  showColumnFilters?: boolean;
  /** Server-side sort: show sort headers and use sort/onSortChange instead of client sort */
  serverSort?: boolean;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Server-side column filters: show filter row; parent supplies values and refetches */
  serverColumnFilters?: boolean;
  columnFilters?: Record<string, string>;
  onColumnFiltersChange?: (filters: Record<string, string>) => void;
};

export type SortState = { id: string; desc: boolean } | null;

function getSortValue<T>(row: T, col: DataTableColumn<T>): string | number {
  if (!col.accessor) return "";
  const v = col.accessor(row);
  if (v == null) return "";
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v).toLowerCase();
}

function loadVisibility(storageKey: string | undefined, columns: DataTableColumn<unknown>[]) {
  const defaults: Record<string, boolean> = {};
  for (const col of columns) {
    defaults[col.id] = col.defaultVisible !== false;
  }
  if (!storageKey || typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(`sip-table-cols:${storageKey}`);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Record<string, boolean>;
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  emptyMessage = "No results.",
  storageKey,
  globalFilterPlaceholder = "Search all columns…",
  showGlobalFilter = true,
  toolbarLeft,
  pagination = true,
  pageSize: pageSizeProp = 25,
  pageSizeOptions = [10, 25, 50, 100],
  serverPagination = false,
  totalRows,
  pageIndex: pageIndexProp = 0,
  onPageIndexChange,
  onPageSizeChange,
  showColumnFilters = true,
  serverSort = false,
  sort: sortProp,
  onSortChange,
  serverColumnFilters = false,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalColumnFilters, setInternalColumnFilters] = useState<Record<string, string>>({});
  const [internalSort, setInternalSort] = useState<SortState>(null);
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeProp);

  const isServer = Boolean(serverPagination && totalRows != null);
  const columnFilters = useMemo(
    () => (serverColumnFilters ? (columnFiltersProp ?? {}) : internalColumnFilters),
    [columnFiltersProp, internalColumnFilters, serverColumnFilters],
  );
  const sort = serverSort ? (sortProp ?? null) : internalSort;
  const showFilters = showColumnFilters && (!isServer || serverColumnFilters);
  const pageIndex = isServer ? pageIndexProp : internalPageIndex;
  const pageSize = isServer ? pageSizeProp : internalPageSize;

  const goToPage = useCallback(
    (index: number) => {
      if (isServer) onPageIndexChange?.(index);
      else setInternalPageIndex(index);
    },
    [isServer, onPageIndexChange],
  );

  const changePageSize = useCallback(
    (size: number) => {
      if (isServer) {
        onPageSizeChange?.(size);
        onPageIndexChange?.(0);
      } else {
        setInternalPageSize(size);
        setInternalPageIndex(0);
      }
    },
    [isServer, onPageIndexChange, onPageSizeChange],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    loadVisibility(storageKey, columns as DataTableColumn<unknown>[]),
  );
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(`sip-table-cols:${storageKey}`, JSON.stringify(columnVisibility));
  }, [columnVisibility, storageKey]);

  useEffect(() => {
    if (!isServer) setInternalPageIndex(0);
  }, [globalFilter, columnFilters, sort, data, internalPageSize, isServer]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => columnVisibility[c.id] !== false),
    [columns, columnVisibility],
  );

  const toggleSort = useCallback(
    (columnId: string) => {
      const next: SortState = (() => {
        if (sort?.id !== columnId) return { id: columnId, desc: false };
        if (!sort.desc) return { id: columnId, desc: true };
        return null;
      })();
      if (serverSort) onSortChange?.(next);
      else setInternalSort(next);
    },
    [onSortChange, serverSort, sort],
  );

  const setColumnFilter = useCallback(
    (columnId: string, value: string) => {
      if (serverColumnFilters) {
        onColumnFiltersChange?.({ ...columnFilters, [columnId]: value });
      } else {
        setInternalColumnFilters((f) => ({ ...f, [columnId]: value }));
      }
    },
    [columnFilters, onColumnFiltersChange, serverColumnFilters],
  );

  const processedRows = useMemo(() => {
    if (isServer) return data;

    let rows = [...data];
    const gf = globalFilter.trim().toLowerCase();

    if (gf) {
      rows = rows.filter((row) =>
        columns.some((col) => {
          if (columnVisibility[col.id] === false) return false;
          return getSortValue(row, col).toString().includes(gf);
        }),
      );
    }

    for (const col of columns) {
      const fv = columnFilters[col.id]?.trim().toLowerCase();
      if (!fv || col.filterable === false) continue;
      rows = rows.filter((row) => getSortValue(row, col).toString().includes(fv));
    }

    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col && col.sortable !== false) {
        rows.sort((a, b) => {
          const av = getSortValue(a, col);
          const bv = getSortValue(b, col);
          let cmp = 0;
          if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
          else cmp = String(av).localeCompare(String(bv));
          return sort.desc ? -cmp : cmp;
        });
      }
    }

    return rows;
  }, [data, columns, columnVisibility, globalFilter, columnFilters, sort, isServer]);

  const paginationTotal = isServer ? totalRows! : processedRows.length;
  const pageCount = pagination ? Math.max(1, Math.ceil(paginationTotal / pageSize)) : 1;
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    if (isServer) return;
    if (internalPageIndex > pageCount - 1) {
      setInternalPageIndex(Math.max(0, pageCount - 1));
    }
  }, [internalPageIndex, pageCount, isServer]);

  const paginatedRows =
    pagination && !isServer
      ? processedRows.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize)
      : processedRows;

  const rangeStart = paginationTotal === 0 ? 0 : safePageIndex * pageSize + 1;
  const rangeEnd = Math.min((safePageIndex + 1) * pageSize, paginationTotal);

  const hideableColumns = columns.filter((c) => c.enableHiding !== false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarLeft}
        {showGlobalFilter && (
          <Input
            placeholder={globalFilterPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs h-9"
          />
        )}
        <div className="flex-1" />
        <div className="relative" ref={columnsRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setColumnsOpen((o) => !o)}
          >
            <Columns3 className="h-4 w-4 mr-2" />
            Columns
          </Button>
          {columnsOpen && (
            <div className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-md border bg-white p-2 shadow-lg">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Show columns</p>
              {hideableColumns.map((col) => (
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={columnVisibility[col.id] !== false}
                    onChange={(e) =>
                      setColumnVisibility((v) => ({ ...v, [col.id]: e.target.checked }))
                    }
                  />
                  {col.header || col.id}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => {
                const isSorted = sort?.id === col.id;
                const canSort =
                  col.sortable !== false &&
                  col.accessor &&
                  (!isServer || serverSort);
                return (
                  <TableHead key={col.id} className={col.headerClassName}>
                    {canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(col.id)}
                      >
                        {col.header}
                        {isSorted ? (
                          sort.desc ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUp className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
            {showFilters && (
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {visibleColumns.map((col) => (
                <TableHead key={`${col.id}-filter`} className="py-1.5 font-normal">
                  {col.filterable !== false && col.accessor ? (
                    <Input
                      placeholder={`Filter…`}
                      value={columnFilters[col.id] ?? ""}
                      onChange={(e) => setColumnFilter(col.id, e.target.value)}
                      className="h-8 text-xs"
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : processedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow key={getRowId(row)}>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className={cn(col.className)}>
                      {col.cell ? col.cell(row) : col.accessor ? String(col.accessor(row) ?? "—") : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && (paginationTotal > 0 || data.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {paginationTotal === 0 ? (
              <>No rows match{isServer ? " search" : ` filters (${data.length} on page)`}</>
            ) : pagination ? (
              <>
                Showing {rangeStart}–{rangeEnd} of {paginationTotal.toLocaleString()}
                {isServer ? " ZIP codes" : " filtered"}
                {!isServer && processedRows.length !== data.length && <> ({data.length} loaded)</>}
              </>
            ) : (
              <>
                Showing {processedRows.length} of {data.length} rows
              </>
            )}
          </p>
          {pagination && paginationTotal > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => changePageSize(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[4.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Page {safePageIndex + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePageIndex <= 0 || loading}
                  onClick={() => goToPage(Math.max(0, safePageIndex - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePageIndex >= pageCount - 1 || loading}
                  onClick={() => goToPage(Math.min(pageCount - 1, safePageIndex + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
