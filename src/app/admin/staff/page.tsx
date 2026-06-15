import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { AdminShell } from "@/components/shared/AdminShell";
import { listSheet } from "@/lib/google-sheets";

export default async function AdminStaffPage() {
  const items = await listSheet("admins");
  return (
    <AdminShell allowed={["Admin"]}>
      <AdminResourceManager
        title="Staff"
        resource="admins"
        items={items.map((admin) => ({ id: admin.id, name: admin.name, email: admin.email, role: admin.role, active: admin.active, title: admin.name }))}
        publishable={false}
        fields={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role", type: "select", options: ["Admin", "Content", "Account"] },
          { key: "active", label: "Status", type: "status", adminOnly: true },
          { key: "password", label: "Password", type: "password" },
          { key: "confirmPassword", label: "Confirm password", type: "password" },
        ]}
      />
    </AdminShell>
  );
}
