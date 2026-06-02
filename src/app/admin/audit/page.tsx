"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: { name: string; email: string };
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
};

function formatChange(log: AuditLog): string {
  const oldT = log.oldValue?.territory as string | undefined;
  const newT = log.newValue?.territory as string | undefined;
  const county = (log.newValue?.county ?? log.oldValue?.county) as string | undefined;

  if (county && oldT && newT) {
    return `${county}: ${oldT} → ${newT}`;
  }
  if (log.action === "IMPORT") {
    return `Imported ${log.newValue?.rows ?? "?"} rows`;
  }
  return `${log.action} ${log.entityType}`;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = useMemo<DataTableColumn<AuditLog>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessor: (log) => log.user?.name ?? "System",
      },
      {
        id: "change",
        header: "Change",
        accessor: (log) => formatChange(log),
        cell: (log) => <span className="max-w-md block">{formatChange(log)}</span>,
      },
      {
        id: "action",
        header: "Action",
        accessor: (log) => log.action,
        defaultVisible: false,
      },
      {
        id: "type",
        header: "Type",
        accessor: (log) => log.entityType,
        cell: (log) => <Badge variant="outline">{log.entityType}</Badge>,
      },
      {
        id: "date",
        header: "Date",
        accessor: (log) => log.createdAt,
        cell: (log) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit History</h1>
        <p className="text-muted-foreground">Track all territory and data changes</p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        getRowId={(log) => log.id}
        loading={loading}
        storageKey="audit"
        emptyMessage="No audit entries yet."
      />
    </div>
  );
}
