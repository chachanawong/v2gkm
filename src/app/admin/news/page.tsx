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
          { key: "title", label: "Title", required: true },
          { key: "eventDate", label: "วันที่จัดงาน", required: true, placeholder: "เช่น วันเสาร์ที่ 16 พฤษภาคม 2569" },
          { key: "eventTime", label: "เวลา", required: true, placeholder: "เช่น 14.30 - 17.00 น." },
          { key: "eventChannel", label: "ช่องทาง", required: true, placeholder: "เช่น Tipco Tower / Zoom" },
          { key: "body", label: "รายละเอียด", type: "textarea", required: true },
          { key: "categories", label: "Category Tags", options: categoryOptions },
          { key: "images", label: "Images", required: true },
          { key: "visibility", label: "Visibility", type: "select" },
        ]}
      />
    </AdminShell>
  );
}
