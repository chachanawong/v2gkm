import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { batchListSheets } from "@/lib/google-sheets";
import type { Category, Knowledge } from "@/lib/types";

export default async function AdminKnowledgePage() {
  const data = await batchListSheets(["knowledge", "categories"]) as { knowledge: Knowledge[]; categories: Category[] };
  const categoryOptions = data.categories.filter((item) => item.active !== false && item.level !== "secret").map((item) => item.name);
  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="Knowledge"
        resource="knowledge"
        items={data.knowledge}
        fields={[
          { key: "title", label: "Title" },
          { key: "youtubeUrl", label: "YouTube URL" },
          { key: "categories", label: "Category Tags", options: categoryOptions },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
    </AdminShell>
  );
}
