import { CsvImporter } from "@/components/admin/CsvImporter";
import { AdminPage } from "@/components/layout/AdminPage";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";

export default function ImportPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="CSV Import"
        description="Import territories, county assignments, or ZIP codes. Preview validates before save."
      />
      <CsvImporter />
    </AdminPage>
  );
}
