"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerritoryForm } from "@/components/admin/TerritoryForm";
import type { TerritoryInput } from "@/lib/validators/territory";

type Territory = {
  id: string;
  name: string;
  color: string;
  shipDay: string | null;
  cutoffDay: string | null;
  active: boolean;
  shippingMethod: { id: string; name: string };
  _count: { assignments: number };
};

type Method = { id: string; name: string };

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Territory | null>(null);

  const load = useCallback(() => {
    fetch("/api/territories").then((r) => r.json()).then(setTerritories);
    fetch("/api/shipping-methods").then((r) => r.json()).then(setMethods);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: TerritoryInput) => {
    if (editing) {
      await fetch("/api/territories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/territories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/territories?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    load();
  }, [load]);

  const columns = useMemo<DataTableColumn<Territory>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessor: (t) => t.name,
        cell: (t) => (
          <span className="font-medium flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border shrink-0" style={{ backgroundColor: t.color }} />
            {t.name}
          </span>
        ),
      },
      {
        id: "method",
        header: "Method",
        accessor: (t) => t.shippingMethod.name,
      },
      {
        id: "shipDay",
        header: "Ship Day",
        accessor: (t) => t.shipDay ?? "",
        cell: (t) => t.shipDay ?? "—",
      },
      {
        id: "cutoff",
        header: "Cutoff",
        accessor: (t) => t.cutoffDay ?? "",
        cell: (t) => t.cutoffDay ?? "—",
      },
      {
        id: "counties",
        header: "Counties",
        accessor: (t) => t._count.assignments,
      },
      {
        id: "status",
        header: "Status",
        accessor: (t) => (t.active ? "Active" : "Inactive"),
        cell: (t) => (
          <Badge variant={t.active ? "default" : "secondary"}>
            {t.active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        sortable: false,
        filterable: false,
        className: "w-24",
        cell: (t) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditing(t);
                setOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(t.id)}
              disabled={t._count.assignments > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDelete],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Territories</h1>
          <p className="text-muted-foreground">Manage shipping territories and routes</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Territory
        </Button>
      </div>

      <DataTable
        data={territories}
        columns={columns}
        getRowId={(t) => t.id}
        storageKey="territories"
        emptyMessage="No territories yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Territory" : "New Territory"}</DialogTitle>
          </DialogHeader>
          <TerritoryForm
            methods={methods}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    shippingMethodId: editing.shippingMethod.id,
                    color: editing.color,
                    shipDay: editing.shipDay ?? undefined,
                    cutoffDay: editing.cutoffDay ?? undefined,
                    active: editing.active,
                  }
                : undefined
            }
            onSubmit={handleSave}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
