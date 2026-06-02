"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  shippingMethodSchema,
  type ShippingMethodInput,
} from "@/lib/validators/shipping-method";

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: { territories: number };
};

export default function ShippingMethodsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);

  const form = useForm<ShippingMethodInput>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: { name: "", description: "", sortOrder: 0 },
  });

  const load = () => {
    fetch("/api/shipping-methods")
      .then((r) => r.json())
      .then(setMethods);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    const nextOrder =
      methods.length > 0 ? Math.max(...methods.map((m) => m.sortOrder)) + 1 : 0;
    form.reset({ name: "", description: "", sortOrder: nextOrder });
    setOpen(true);
  };

  const openEdit = (m: ShippingMethod) => {
    setEditing(m);
    form.reset({
      name: m.name,
      description: m.description ?? "",
      sortOrder: m.sortOrder,
    });
    setOpen(true);
  };

  const onSubmit = async (data: ShippingMethodInput) => {
    const res = editing
      ? await fetch("/api/shipping-methods", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...data }),
        })
      : await fetch("/api/shipping-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

    if (!res.ok) {
      const err = await res.json();
      alert(typeof err.error === "string" ? err.error : "Save failed");
      return;
    }

    setOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/shipping-methods?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(typeof err.error === "string" ? err.error : "Delete failed");
      return;
    }
    load();
  };

  const columns = useMemo<DataTableColumn<ShippingMethod>[]>(
    () => [
      {
        id: "sortOrder",
        header: "Order",
        accessor: (m) => m.sortOrder,
        className: "w-20",
      },
      {
        id: "name",
        header: "Name",
        accessor: (m) => m.name,
        cell: (m) => <span className="font-medium">{m.name}</span>,
      },
      {
        id: "description",
        header: "Description",
        accessor: (m) => m.description ?? "",
        cell: (m) => m.description ?? "—",
      },
      {
        id: "territories",
        header: "Territories",
        accessor: (m) => m._count.territories,
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        sortable: false,
        filterable: false,
        className: "w-24",
        cell: (m) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(m.id)}
              disabled={m._count.territories > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [methods],
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipping Methods</h1>
          <p className="text-muted-foreground">
            Define how you ship (e.g. truck, LTL, common carrier). Territories are grouped under each
            method.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Method
        </Button>
      </div>

      <DataTable
        data={methods}
        columns={columns}
        getRowId={(m) => m.id}
        storageKey="shipping-methods"
        emptyMessage="No shipping methods yet. Create one, then add territories."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shipping Method" : "New Shipping Method"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Fabuwood Truck" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Optional notes for your team"
                {...form.register("description")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Display order</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in lists and legends.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
