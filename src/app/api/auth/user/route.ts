import { findUserPin, loginUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateBoMemberLoginPin } from "@/lib/bo-members";
import { createUserToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizePhone(v: string) {
  return String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

async function savePin(phone: string, pin: string, userName: string, userId: string) {
  const norm = normalizePhone(phone);
  await updateBoMemberLoginPin(norm, pin);
  await writeAuditLog({ actor: userName, role: "user", action: "set_pin", resource: `users:${userId}` });
}

async function findPin(phone: string): Promise<string | null> {
  return findUserPin(phone);
}

export async function POST(request: Request) {
  const body = await request.json() as { phone?: string; loginPin?: string; newPin?: string };
  const { phone, loginPin, newPin } = body;

  if (!/^\d{9,12}$/.test(String(phone ?? "").replace(/\D/g, ""))) {
    return Response.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Step 1: phone-only check — return PIN status
  if (!loginPin && !newPin) {
    const user = await loginUser(String(phone));
    if (!user) return Response.json({ status: "not_found" }, { status: 401 });
    const existingPin = await findPin(String(phone));
    return Response.json({ status: existingPin ? "has_pin" : "needs_pin" });
  }

  // Step 2a: verify existing PIN
  if (loginPin) {
    const user = await loginUser(String(phone));
    if (!user) return Response.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 401 });
    const existingPin = await findPin(String(phone));
    if (!existingPin) return Response.json({ error: "ยังไม่มี Login PIN กรุณาตั้งค่า PIN ก่อน" }, { status: 400 });
    if (existingPin !== loginPin) return Response.json({ error: "Login PIN ไม่ถูกต้อง" }, { status: 401 });
    await writeAuditLog({ actor: user.name, role: "user", action: "login", resource: `users:${user.id}` });
    return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
  }

  // Step 2b: set new PIN
  if (newPin) {
    if (!/^\d{4,6}$/.test(newPin)) {
      return Response.json({ error: "PIN ต้องเป็นตัวเลข 4-6 หลัก" }, { status: 400 });
    }
    const user = await loginUser(String(phone));
    if (!user) return Response.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 401 });
    const existingPin = await findPin(String(phone));
    if (existingPin) return Response.json({ error: "มี PIN อยู่แล้ว กรุณาใช้ PIN เดิม" }, { status: 409 });
    await savePin(String(phone), newPin, user.name, user.id);
    return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}
