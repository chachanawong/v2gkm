import { loginAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createAdminToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "")) || String(password ?? "").length < 6) {
    return Response.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const admin = await loginAdmin(email, password);
  if (!admin) return Response.json({ error: "Admin not found" }, { status: 401 });
  await writeAuditLog({ actor: admin.name, role: "admin", action: "login", resource: `admins:${admin.id}` });
  return Response.json({ admin, token: createAdminToken({ id: admin.id, role: admin.role }) });
}
