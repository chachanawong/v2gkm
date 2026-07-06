import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { getCategoryOptionNames } from "@/lib/category-settings";
import { batchListSheets } from "@/lib/google-sheets";
import type { Category, News } from "@/lib/types";

export default async function AdminNewsPage() {
  const data = await batchListSheets(["news", "categories"]) as { news: News[]; categories: Category[] };
  const categoryOptions = getCategoryOptionNames(data.categories, "news");
  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="News"
        resource="news"
        items={data.news}
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "eventDate", label: "วันที่จัดงาน", type: "date", required: true },
          { key: "eventTime", label: "เวลา", type: "time-range", required: true },
          {
            key: "eventChannel",
            label: "ช่องทาง",
            type: "select-other",
            required: true,
            options: [
              { value: "Tipco Tower", label: "Tipco Tower" },
              { value: "Zoom", label: "Zoom" },
              { value: "__other__", label: "อื่นๆ" },
            ],
            placeholder: "ระบุช่องทางอื่นๆ",
          },
          { key: "body", label: "รายละเอียด", type: "textarea", required: true },
          { key: "categories", label: "Category Tags", options: categoryOptions },
          { key: "images", label: "Images", required: true },
          {
            key: "pinned",
            label: "Highlight",
            type: "select",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
    </AdminShell>
  );
}
