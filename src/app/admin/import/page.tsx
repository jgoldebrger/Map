import { CsvImporter } from "@/components/admin/CsvImporter";

export default function ImportPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSV Import</h1>
        <p className="text-muted-foreground">
          Import territories, county assignments, or ZIP codes. Preview validates before save.
        </p>
      </div>
      <CsvImporter />
    </div>
  );
}
