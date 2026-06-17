import { listBoUsers } from "@/lib/bo-members";
import { listSheet } from "@/lib/google-sheets";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import type { AuditLog } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (session?.kind !== "user") {
    return Response.json({ error: "User session required" }, { status: 401 });
  }

  const users = await listBoUsers();
  const user = users.find((item) => item.id === session.id && item.active !== false);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const logs = await listSheet("audit_logs");
  const recent = (logs as AuditLog[])
    .filter((log) => log.role === "user")
    .filter((log) => {
      if (String(log.resource ?? "").startsWith(`users:${session.id}`)) return true;
      return log.actor === user.name;
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return Response.json({ logs: recent });
}
