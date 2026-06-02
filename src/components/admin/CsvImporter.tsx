"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IMPORT_TYPES = [
  { value: "territories", label: "Territories" },
  { value: "counties", label: "Counties" },
  { value: "zips", label: "ZIP Codes" },
] as const;

type ImportType = (typeof IMPORT_TYPES)[number]["value"];

export function CsvImporter() {
  const [type, setType] = useState<ImportType>("territories");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<unknown[] | null>(null);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/import/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, preview: true }),
    });
    const data = await res.json();
    setPreview(data.preview);
    setErrors(data.errors ?? []);
    setLoading(false);
  };

  const handleImport = async () => {
    if (!confirm("Import data? This cannot be undone easily.")) return;
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/import/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(`Successfully imported ${data.imported} rows.`);
      setCsv("");
      setPreview(null);
    } else {
      setErrors(data.errors ?? [{ row: 0, message: data.error ?? data.message }]);
    }
  };

  const sampleCsv: Record<ImportType, string> = {
    territories: "name,method,color,shipday,cutoffday,notes\nNew Territory,Your Method Name,#FF0000,Monday,Friday,",
    counties: "fips,territory\n36061,FT NYC Metro",
    zips: "zip,city,county,state\n07652,Paramus,Bergen,NJ",
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Import type</Label>
        <Select value={type} onValueChange={(v) => setType(v as ImportType)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>CSV data</Label>
        <Textarea
          className="font-mono text-xs min-h-[200px]"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={sampleCsv[type]}
        />
        <Button variant="outline" size="sm" onClick={() => setCsv(sampleCsv[type])}>
          Load sample format
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handlePreview} disabled={!csv || loading}>
          Preview & Validate
        </Button>
        <Button onClick={handleImport} disabled={!csv || loading || errors.length > 0}>
          Import
        </Button>
      </div>

      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Validation Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {preview !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview (first 10 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">{JSON.stringify(preview, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {result && <p className="text-sm text-green-600">{result}</p>}
    </div>
  );
}
