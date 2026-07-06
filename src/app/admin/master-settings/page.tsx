import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { categoryTypeLabel, filterCategoriesByType, isUnassignedCategory, sortCategoriesByName } from "@/lib/category-settings";
import { listSheet } from "@/lib/google-sheets";
import type { CategoryType } from "@/lib/types";

const categoryTypes: CategoryType[] = ["knowledge", "news", "profiles"];

export default async function AdminMasterSettingsPage() {
  const items = sortCategoriesByName(await listSheet("categories"));
  const unassigned = items.filter(isUnassignedCategory);

  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <section className="admin-section" style={{ gap: 16 }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Admin Settings</p>
            <h1>Master Settings</h1>
          </div>
        </div>
        <p style={{ marginTop: -8, color: "var(--secondary)", fontSize: 13 }}>
          Set category lists separately for Knowledge, News, and Profile. Legacy categories without a type are shown below until you sort them.
        </p>
      </section>

      {unassigned.length ? (
        <div style={{ marginTop: 32 }}>
          <AdminResourceManager
            title="Legacy / Unassigned Categories"
            resource="categories"
            items={unassigned}
            publishable={false}
            defaultValues={{ active: true }}
            eyebrow={null}
            fields={[
              { key: "name", label: "Category name" },
              { key: "active", label: "Active", type: "checkbox" },
            ]}
          />
        </div>
      ) : null}

      {categoryTypes.map((type) => (
        <div key={type} style={{ marginTop: 56 }}>
          <AdminResourceManager
            title={`${categoryTypeLabel(type)} Categories`}
            resource="categories"
            items={filterCategoriesByType(items, type, { includeLegacy: false, activeOnly: false })}
            publishable={false}
            defaultValues={{ active: true, type }}
            fixedValues={{ type }}
            eyebrow={null}
            fields={[
              { key: "name", label: "Category name" },
              { key: "active", label: "Active", type: "checkbox" },
            ]}
          />
        </div>
      ))}
    </AdminShell>
  );
}
