import { batchListSheets } from "@/lib/google-sheets";
import { listBoUsers } from "@/lib/bo-members";
import { listPendingPinResetRequests } from "@/lib/pin-reset-requests";
import type { AuditLog, Knowledge, News, PinResetRequest, Profile, User } from "@/lib/types";

export type AdminDashboardData = {
  users: User[];
  knowledge: Knowledge[];
  news: News[];
  profiles: Profile[];
  audit_logs: AuditLog[];
  pin_reset_requests: PinResetRequest[];
};

const dashboardTtl = 300_000;

let dashboardCache: { data: AdminDashboardData; expiresAt: number } | null = null;
let dashboardRequest: Promise<AdminDashboardData> | null = null;

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
    return dashboardCache.data;
  }

  if (dashboardRequest) return dashboardRequest;

  dashboardRequest = (async () => {
    try {
      const [content, users, pinResetRequests] = await Promise.all([
        batchListSheets(["knowledge", "news", "profiles", "audit_logs"]),
        listBoUsers(),
        listPendingPinResetRequests(),
      ]);

      const data: AdminDashboardData = {
        users: users.filter((user) => user.active !== false),
        knowledge: content.knowledge as Knowledge[],
        news: content.news as News[],
        profiles: content.profiles as Profile[],
        audit_logs: content.audit_logs as AuditLog[],
        pin_reset_requests: pinResetRequests,
      };

      dashboardCache = {
        data,
        expiresAt: Date.now() + dashboardTtl,
      };

      return data;
    } catch (error) {
      console.error("[admin-dashboard] failed to load dashboard data", error);
      return { users: [], knowledge: [], news: [], profiles: [], audit_logs: [], pin_reset_requests: [] };
    } finally {
      dashboardRequest = null;
    }
  })();

  return dashboardRequest;
}

export function clearAdminDashboardCache() {
  dashboardCache = null;
  dashboardRequest = null;
}
