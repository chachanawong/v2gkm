import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { listSheet } from "@/lib/google-sheets";

export default async function AdminCategoriesPage() {
  const items = await listSheet("categories");
  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="Categories"
        resource="categories"
        items={items}
        publishable={false}
        fields={[
          { key: "name", label: "Category name" },
          { key: "active", label: "Active", type: "checkbox" },
        ]}
      />
    </AdminShell>
  );
}
