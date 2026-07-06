import { writeAuditLog } from "@/lib/audit";
import { assertAdminRequest, getAdminSession } from "@/lib/auth";
import { clearBoMemberLoginPin } from "@/lib/bo-members";
import { listPendingPinResetRequests, listPinResetRequests, upsertPinResetRequest } from "@/lib/pin-reset-requests";
import type { PinResetRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const items = await listPendingPinResetRequests();
  return Response.json({ items });
}

export async function POST(request: Request) {
  const session = getAdminSession(request);
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({})) as {
    id?: string;
    action?: "approve" | "reject";
    note?: string;
  };

  if (!body.id || !body.action) {
    return Response.json({ error: "Missing request id or action" }, { status: 400 });
  }

  const requests = await listPinResetRequests();
  const item = requests.find((entry) => entry.id === body.id);
  if (!item) return Response.json({ error: "Request not found" }, { status: 404 });

  const next = {
    ...item,
    status: body.action === "approve" ? "approved" : "rejected",
    resolvedAt: new Date().toISOString(),
    resolvedBy: session?.role ?? "Admin",
    note: String(body.note || item.note || "").trim(),
  } as const;

  if (body.action === "approve") {
    await clearBoMemberLoginPin(item.phone);
  }

  await upsertPinResetRequest(next);
  await writeAuditLog({
    actor: request.headers.get("x-admin-name") ?? session?.role ?? "admin",
    role: "admin",
    action: body.action === "approve" ? "approved_pin_reset" : "rejected_pin_reset",
    resource: `pin_reset_requests:${item.phone}`,
  });

  return Response.json({ success: true, item: next });
}
