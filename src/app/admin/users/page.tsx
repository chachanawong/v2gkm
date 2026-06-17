import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminShell } from "@/components/shared/AdminShell";
import { listBoUsers } from "@/lib/bo-members";

export default async function AdminUsersPage() {
  const items = await listBoUsers();
  return (
    <AdminShell allowed={["Admin", "Account"]}>
      <section className="admin-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Members</p>
            <h1>Business Owner Members</h1>
          </div>
        </div>
        <AdminUsersTable items={items} />
      </section>
    </AdminShell>
  );
}
