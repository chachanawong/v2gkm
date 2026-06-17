import { AdminShell } from "@/components/shared/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { listBoUsers } from "@/lib/bo-members";

export default async function AdminUsersPage() {
  const items = (await listBoUsers()).filter((item) => item.active !== false);
  return (
    <AdminShell allowed={["Admin", "Account"]}>
      <section className="admin-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Members</p>
            <h1>Business Owner Members</h1>
          </div>
        </div>
        <div className="list-panel">
          <h2>bo_members <span style={{ fontWeight: 400, color: "var(--outline)", fontSize: 10 }}>({items.length})</span></h2>
          <div className="admin-list">
            {items.map((item) => (
              <div className="admin-row admin-row-users" key={item.id}>
                <div className="row-summary row-summary-table row-summary-users">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.phone}</span>
                  </div>
                  <div>
                    <strong>{item.membership}</strong>
                    <span>{item.uplinePlatinum || "-"}</span>
                  </div>
                </div>
                <div className="status-stack">
                  <Badge tone="dark">{item.active === false ? "Inactive" : "Active"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
