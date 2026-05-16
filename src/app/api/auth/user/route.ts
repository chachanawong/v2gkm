import { loginUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createUserToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!/^\d{9,12}$/.test(String(phone ?? ""))) {
    return Response.json({ error: "Invalid phone number" }, { status: 400 });
  }
  const user = await loginUser(phone);
  if (!user) return Response.json({ error: "User not found" }, { status: 401 });
  await writeAuditLog({ actor: user.name, role: "user", action: "login", resource: `users:${user.id}` });
  return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
}
