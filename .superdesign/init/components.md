# Shared UI Components

**Library:** shadcn/ui (Radix primitives + CVA + Tailwind)  
**Path:** `src/components/ui/`  
**Utils:** `src/lib/utils.ts` — `cn()` via clsx + tailwind-merge

---

## Button

**Path:** `src/components/ui/button.tsx`  
**Description:** Primary action button with variant/size props and `asChild` slot support.

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## Input

**Path:** `src/components/ui/input.tsx`  
**Description:** Styled text input with focus ring and file input support.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

---

## Select

**Path:** `src/components/ui/select.tsx`  
**Description:** Radix Select with trigger, content portal, and item components.

```tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
```

---

## Card

**Path:** `src/components/ui/card.tsx`  
**Description:** Card container with Header, Title, Description, Content subcomponents.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

---

## Label

**Path:** `src/components/ui/label.tsx`  
**Description:** Radix Label with consistent form label styling.

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

---

## Badge

**Path:** `src/components/ui/badge.tsx`  
**Description:** Inline status badge with default/secondary/outline variants.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

---

## Dialog

**Path:** `src/components/ui/dialog.tsx`  
**Description:** Radix Dialog modal with overlay, content, header, title.

```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle };
```

---

## Switch

**Path:** `src/components/ui/switch.tsx`  
**Description:** Radix toggle switch.

```tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

---

## Textarea

**Path:** `src/components/ui/textarea.tsx`  
**Description:** Styled multiline text input.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

---

## Table

**Path:** `src/components/ui/table.tsx`  
**Description:** Semantic table primitives with hover row styling.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
```

---

## DataTable

**Path:** `src/components/ui/data-table.tsx`  
**Description:** Full-featured data table with sorting, filtering, pagination, column visibility. Used in admin ZIP codes and territories pages.

```tsx
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
  enableHiding?: boolean;
  className?: string;
  headerClassName?: string;
  sortValue?: (row: T) => string | number;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  storageKey?: string;
  globalFilterPlaceholder?: string;
  showGlobalFilter?: boolean;
  toolbarLeft?: ReactNode;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  serverPagination?: boolean;
  totalRows?: number;
  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showColumnFilters?: boolean;
  serverSort?: boolean;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  serverColumnFilters?: boolean;
  columnFilters?: Record<string, string>;
  onColumnFiltersChange?: (filters: Record<string, string>) => void;
};

export type SortState = { id: string; desc: boolean } | null;

function getFilterValue<T>(row: T, col: DataTableColumn<T>): string {
  if (!col.accessor) return "";
  const v = col.accessor(row);
  if (v == null) return "";
  return String(v).toLowerCase();
}

function getSortValue<T>(row: T, col: DataTableColumn<T>): string | number {
  if (col.sortValue) return col.sortValue(row);
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
          return getFilterValue(row, col).includes(gf);
        }),
      );
    }

    for (const col of columns) {
      const fv = columnFilters[col.id]?.trim().toLowerCase();
      if (!fv || col.filterable === false) continue;
      rows = rows.filter((row) => getFilterValue(row, col).includes(fv));
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
```
