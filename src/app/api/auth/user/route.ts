import { findUserPin, loginUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { updateBoMemberLoginPin } from "@/lib/bo-members";
import { listPinResetRequests, upsertPinResetRequest } from "@/lib/pin-reset-requests";
import { hashPin, verifyPin } from "@/lib/pin";
import { createUserToken } from "@/lib/session-token";
import type { PinResetRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizePhone(v: string) {
  return String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

async function savePin(phone: string, pin: string, userName: string, userId: string) {
  const norm = normalizePhone(phone);
  await updateBoMemberLoginPin(norm, hashPin(pin, norm));
  await writeAuditLog({ actor: userName, role: "user", action: "set_pin", resource: `users:${userId}` });
}

async function findPin(phone: string) {
  return findUserPin(phone);
}

async function createResetRequest(phone: string, userName: string, userId: string) {
  const norm = normalizePhone(phone);
  const requests = await listPinResetRequests();
  const existing = requests.find((item) => item.phone === norm && item.status === "pending");
  const next: PinResetRequest = existing
    ? { ...existing, requestedAt: new Date().toISOString(), note: "Requested from login page" }
    : {
        id: `pin-reset-${crypto.randomUUID()}`,
        phone: norm,
        userId,
        userName,
        status: "pending",
        requestedAt: new Date().toISOString(),
        note: "Requested from login page",
      };
  await upsertPinResetRequest(next);
  await writeAuditLog({ actor: userName, role: "user", action: "request_pin_reset", resource: `users:${userId}` });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { phone?: string; loginPin?: string; newPin?: string; requestReset?: boolean };
    const { phone, loginPin, newPin, requestReset } = body;

    if (!/^\d{10}$/.test(String(phone ?? "").replace(/\D/g, ""))) {
      return Response.json({ error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก" }, { status: 400 });
    }

    if (requestReset) {
      const user = await loginUser(String(phone));
      if (!user) return Response.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 401 });
      await createResetRequest(String(phone), user.name, user.id);
      return Response.json({ success: true, message: "ส่งคำขอรีเซ็ต PIN ไปยัง Admin แล้ว" });
    }

    // Step 1: phone-only check — return PIN status
    if (!loginPin && !newPin) {
      const user = await loginUser(String(phone));
      if (!user) return Response.json({ status: "not_found" }, { status: 401 });
      const existingPin = await findPin(String(phone));
      return Response.json({ status: existingPin.hash ? "has_pin" : "needs_pin" });
    }

    // Step 2a: verify existing PIN
    if (loginPin) {
      const user = await loginUser(String(phone));
      if (!user) return Response.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 401 });
      const existingPin = await findPin(String(phone));
      if (!existingPin.hash) return Response.json({ error: "ยังไม่มี Login PIN กรุณาตั้งค่า PIN ก่อน" }, { status: 400 });
      const valid = verifyPin(loginPin, String(phone), existingPin.hash);
      if (!valid) return Response.json({ error: "Login PIN ไม่ถูกต้อง" }, { status: 401 });
      await writeAuditLog({ actor: user.name, role: "user", action: "login", resource: `users:${user.id}` });
      return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
    }

    // Step 2b: set new PIN
    if (newPin) {
      if (!/^\d{6}$/.test(newPin)) {
        return Response.json({ error: "PIN ต้องเป็นตัวเลข 6 หลัก" }, { status: 400 });
      }
      const user = await loginUser(String(phone));
      if (!user) return Response.json({ error: "ไม่พบเบอร์นี้ในระบบ" }, { status: 401 });
      const existingPin = await findPin(String(phone));
      if (existingPin.hash) return Response.json({ error: "มี PIN อยู่แล้ว กรุณาใช้ PIN เดิม" }, { status: 409 });
      await savePin(String(phone), newPin, user.name, user.id);
      return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return Response.json({ error: message }, { status: 500 });
  }
}
