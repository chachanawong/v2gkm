import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { batchListSheets } from "@/lib/google-sheets";
import type { Category, News } from "@/lib/types";

export default async function AdminNewsPage() {
  const data = await batchListSheets(["news", "categories"]) as { news: News[]; categories: Category[] };
  const categoryOptions = data.categories.filter((item) => item.active !== false).map((item) => item.name);
  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="News"
        resource="news"
        items={data.news}
        fields={[
          { key: "title", label: "Title" },
          { key: "body", label: "Detail", type: "textarea" },
          { key: "categories", label: "Category Tags", options: categoryOptions },
          { key: "images", label: "Images" },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
    </AdminShell>
  );
}
