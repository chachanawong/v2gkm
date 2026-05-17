import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { listSheet } from "@/lib/google-sheets";

export default async function AdminCategoriesPage() {
  const items = await listSheet("categories");
  return (
    <AdminShell allowed={["Admin"]}>
      <AdminResourceManager
        title="Categories"
        resource="categories"
        items={items}
        publishable={false}
        fields={[
          { key: "name", label: "Category name" },
          { key: "level", label: "Level", type: "select", options: ["public", "secret"], adminOnly: true },
          { key: "active", label: "Active", type: "checkbox" },
        ]}
      />
    </AdminShell>
  );
}
