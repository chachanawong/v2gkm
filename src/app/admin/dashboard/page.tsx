import { AdminShell } from "@/components/shared/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { batchListSheets } from "@/lib/google-sheets";
import { listBoUsers } from "@/lib/bo-members";
import type { AuditLog, Knowledge, News, Profile, User } from "@/lib/types";

export default async function AdminDashboardPage() {
  const data = await loadDashboardData();
  const distribution = data.users.reduce<Record<string, number>>(
    (acc, user) => ({ ...acc, [user.membership]: (acc[user.membership] ?? 0) + 1 }),
    {},
  );
  const max = Math.max(...Object.values(distribution), 1);

  return (
    <AdminShell allowed={["Admin"]}>
      <section className="admin-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Analytics</p>
            <h1>Dashboard</h1>
          </div>
        </div>
        <div className="metric-grid">
          <Metric label="Users" value={data.users.length} />
          <Metric label="Knowledge" value={data.knowledge.length} />
          <Metric label="News" value={data.news.length} />
          <Metric label="Profiles" value={data.profiles.length} />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Members</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>User distribution</h2>
              </div>
            </div>
            {Object.entries(distribution).map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{formatMembershipLabel(label)}</span>
                <div><i style={{ width: `${(value / max) * 100}%` }} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Knowledge</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Top content</h2>
              </div>
            </div>
            {[...data.knowledge].sort((a, b) => Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0)).slice(0, 5).map((item) => (
              <div className="mini-row" key={item.id}>
                <span>{item.title}</span>
                <Badge tone="neutral">{Number(item.viewCount ?? 0).toLocaleString()} views</Badge>
              </div>
            ))}
          </section>
          <section className="panel wide">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Audit</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent activities</h2>
              </div>
              <Badge tone="neutral">7 days</Badge>
            </div>
            <ActivityList logs={data.audit_logs} />
          </section>
        </div>
      </section>
    </AdminShell>
  );
}

async function loadDashboardData(): Promise<{
  users: User[];
  knowledge: Knowledge[];
  news: News[];
  profiles: Profile[];
  audit_logs: AuditLog[];
}> {
  try {
    const [content, users] = await Promise.all([
      batchListSheets(["knowledge", "news", "profiles", "audit_logs"]),
      listBoUsers(),
    ]);
    return {
      users: users.filter((user) => user.active !== false),
      knowledge: content.knowledge as Knowledge[],
      news: content.news as News[],
      profiles: content.profiles as Profile[],
      audit_logs: content.audit_logs as AuditLog[],
    };
  } catch (error) {
    console.error("[admin-dashboard] failed to load dashboard data", error);
    return { users: [], knowledge: [], news: [], profiles: [], audit_logs: [] };
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}


function ActivityList({ logs }: { logs: AuditLog[] }) {
  const adminLogs = logs.filter((log) => log.role === "admin").sort((a, b) => b.at.localeCompare(a.at));
  const latestTime = adminLogs[0] ? new Date(adminLogs[0].at).getTime() : 0;
  const recent = adminLogs.filter((log) => latestTime - new Date(log.at).getTime() <= 7 * 24 * 60 * 60 * 1000);
  const primary = recent.slice(0, 5);
  const rest = recent.slice(5);
  return (
    <div className="activity-list">
      {primary.map((log) => <ActivityItem log={log} key={log.id} />)}
      {rest.length ? (
        <details className="view-more">
          <summary>View More</summary>
          {rest.map((log) => <ActivityItem log={log} key={log.id} />)}
        </details>
      ) : null}
    </div>
  );
}

function ActivityItem({ log }: { log: AuditLog }) {
  const [target, title] = String(log.resource ?? "").split(":");
  return (
    <div className="activity-item">
      <i />
      <div>
        <strong>Admin {log.actor} {log.action} {target || "resource"}</strong>
        {title ? <span>&quot;{title}&quot;</span> : null}
        <time>{formatDateTime(log.at)}</time>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

function formatMembershipLabel(value: string) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
