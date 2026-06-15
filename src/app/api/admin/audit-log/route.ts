import { getAdminSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getAdminSession(request);
  if (!session) return Response.json({ error: "Admin session required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const log = await writeAuditLog({
    actor: session.role,
    role: "admin",
    action: String(body.action ?? "edit"),
    resource: String(body.resource ?? "admin"),
  });
  return Response.json({ log });
}
