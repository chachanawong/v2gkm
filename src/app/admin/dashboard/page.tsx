import { AdminShell } from "@/components/shared/AdminShell";
import { PinResetRequestsPanel } from "@/components/admin/PinResetRequestsPanel";
import { Badge } from "@/components/ui/Badge";
import { batchListSheets } from "@/lib/google-sheets";
import { listBoUsers } from "@/lib/bo-members";
import { listPendingPinResetRequests } from "@/lib/pin-reset-requests";
import type { AuditLog, Knowledge, News, PinResetRequest, Profile, User } from "@/lib/types";

export default async function AdminDashboardPage() {
  const data = await loadDashboardData();
  const loggedInUsers = countLoggedInUsers(data.audit_logs);
  const userLoginStats = buildUserLoginStats(data.audit_logs);
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
            <p className="eyebrow">ANALYTICS</p>
            <h1>DASHBOARD</h1>
          </div>
        </div>
        <div className="metric-grid">
          <Metric label="USERS" value={data.users.length} />
          <Metric label="LOGGED IN USERS" value={loggedInUsers} />
          <Metric label="KNOWLEDGE" value={data.knowledge.length} />
          <Metric label="NEWS" value={data.news.length} />
          <Metric label="PROFILES" value={data.profiles.length} />
        </div>
        <div className="dashboard-grid">
          <PinResetRequestsPanel requests={data.pin_reset_requests} />
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">MEMBERS</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>USER DISTRIBUTION</h2>
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
                <p className="eyebrow">LOGINS</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>LOGIN BY USER</h2>
              </div>
            </div>
            {userLoginStats.length ? userLoginStats.map((item) => (
              <div className="mini-row mini-row-panel" key={item.key}>
                <span className="mini-row-label">{item.label}</span>
                <Badge tone="neutral">{item.count} LOGIN{item.count > 1 ? "S" : ""}</Badge>
              </div>
            )) : (
              <p className="muted">ยังไม่มีข้อมูลการ LOGIN</p>
            )}
          </section>
          <section className="panel wide">
            <div className="panel-head">
              <div>
                <p className="eyebrow">KNOWLEDGE</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>TOP CONTENT</h2>
              </div>
            </div>
            {[...data.knowledge].sort((a, b) => Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0)).slice(0, 5).map((item) => (
              <div className="mini-row mini-row-panel mini-row-knowledge" key={item.id}>
                <span className="mini-row-label knowledge-title">{item.title}</span>
                <Badge tone="dark">{Number(item.viewCount ?? 0).toLocaleString()} VIEWS</Badge>
              </div>
            ))}
          </section>
          <section className="panel wide">
            <div className="panel-head">
              <div>
                <p className="eyebrow">AUDIT</p>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>RECENT ACTIVITIES</h2>
              </div>
              <Badge tone="neutral">7 DAYS</Badge>
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
  pin_reset_requests: PinResetRequest[];
}> {
  try {
    const [content, users, pinResetRequests] = await Promise.all([
      batchListSheets(["knowledge", "news", "profiles", "audit_logs"]),
      listBoUsers(),
      listPendingPinResetRequests(),
    ]);
    return {
      users: users.filter((user) => user.active !== false),
      knowledge: content.knowledge as Knowledge[],
      news: content.news as News[],
      profiles: content.profiles as Profile[],
      audit_logs: content.audit_logs as AuditLog[],
      pin_reset_requests: pinResetRequests,
    };
  } catch (error) {
    console.error("[admin-dashboard] failed to load dashboard data", error);
    return { users: [], knowledge: [], news: [], profiles: [], audit_logs: [], pin_reset_requests: [] };
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

function countLoggedInUsers(logs: AuditLog[]) {
  const uniqueUsers = new Set(
    logs
      .filter((log) => log.role === "user" && log.action === "login")
      .map((log) => {
        const resource = String(log.resource ?? "");
        if (resource.startsWith("users:")) {
          return resource.slice("users:".length);
        }
        return String(log.actor ?? "").trim();
      })
      .filter(Boolean),
  );
  return uniqueUsers.size;
}

function buildUserLoginStats(logs: AuditLog[]) {
  const counts = new Map<string, { key: string; label: string; count: number; at: string }>();
  for (const log of logs) {
    if (log.role !== "user" || log.action !== "login") continue;
    const resource = String(log.resource ?? "");
    const key = resource.startsWith("users:") ? resource.slice("users:".length) : String(log.actor ?? "").trim();
    if (!key) continue;
    const current = counts.get(key);
    counts.set(key, {
      key,
      label: String(log.actor ?? "").trim() || key,
      count: (current?.count ?? 0) + 1,
      at: current?.at && current.at > log.at ? current.at : log.at,
    });
  }

  return [...counts.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.at.localeCompare(a.at);
    })
    .slice(0, 8);
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
          <summary>VIEW MORE</summary>
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
