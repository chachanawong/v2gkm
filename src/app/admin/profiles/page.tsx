import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { batchListSheets } from "@/lib/google-sheets";
import type { Category, Profile } from "@/lib/types";

export default async function AdminProfilesPage() {
  const data = await batchListSheets(["profiles", "categories"]) as { profiles: Profile[]; categories: Category[] };
  const categoryOptions = data.categories.filter((item) => item.active !== false && item.level !== "secret").map((item) => item.name);
  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="Profiles"
        resource="profiles"
        items={data.profiles.map((item) => ({ ...item, title: item.name }))}
        fields={[
          { key: "name", label: "Name" },
          { key: "pin", label: "PIN" },
          { key: "bio", label: "Bio", type: "textarea" },
          { key: "position", label: "Position" },
          { key: "categories", label: "Category Tags", options: categoryOptions },
          { key: "images", label: "Multiple images" },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
    </AdminShell>
  );
}
