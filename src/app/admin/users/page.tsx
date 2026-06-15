import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { listSheet } from "@/lib/google-sheets";

export default async function AdminUsersPage() {
  const items = await listSheet("users");
  return (
    <AdminShell allowed={["Admin", "Account"]}>
      <AdminResourceManager
        title="Users"
        resource="users"
        items={items.map((item) => ({ ...item, title: item.name }))}
        publishable={false}
        fields={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "membership", label: "Membership", type: "select", options: ["general", "silver", "platinum"] },
          { key: "uplinePlatinum", label: "Upline platinum" },
          { key: "active", label: "Status", type: "status", adminOnly: true },
        ]}
      />
    </AdminShell>
  );
}
