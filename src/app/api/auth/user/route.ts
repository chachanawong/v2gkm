import { loginUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { lookupBoMemberPin } from "@/lib/bo-members";
import { listSheet, upsertSheet } from "@/lib/google-sheets";
import { createUserToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizePhone(v: string) {
  return String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

// Store PINs in audit_logs with resource="login_pin" (no new sheet needed)
async function findLogPin(phone: string): Promise<string | null> {
  try {
    const norm = normalizePhone(phone);
    const logs = await listSheet("audit_logs");
    const entry = logs.find((l) => l.resource === "login_pin" && String(l.actor) === norm);
    return entry ? String(entry.action) : null;
  } catch {
    return null;
  }
}

async function findSheetPin(phone: string): Promise<string | null> {
  try {
    const norm = normalizePhone(phone);
    const [userPins, registerPins] = await Promise.all([
      listSheet("user_pins"),
      listSheet("register"),
    ]);
    const fromUserPins = userPins.find((row) => normalizePhone(String(row.phone ?? "")) === norm);
    if (fromUserPins?.loginPin) return String(fromUserPins.loginPin);
    const fromRegister = registerPins.find((row) => normalizePhone(String(row.phone ?? "")) === norm);
    if (fromRegister?.loginpin) return String(fromRegister.loginpin);
    return null;
  } catch {
    return null;
  }
}

async function saveLogPin(phone: string, pin: string, userName: string, userId: string) {
  const norm = normalizePhone(phone);
  await Promise.all([
    upsertSheet("audit_logs", {
      id: `pin:${norm}`,
      actor: norm,
      role: "user",
      action: pin,
      resource: "login_pin",
      at: new Date().toISOString(),
    }),
    upsertSheet("user_pins", { phone: norm, loginPin: pin }).catch((e) =>
      console.error("[save_user_pins_pin] user_pins sheet error:", e),
    ),
    upsertSheet("register", { phone: norm, loginpin: pin }).catch((e) =>
      console.error("[save_register_pin] register sheet error:", e),
    ),
  ]);
  await writeAuditLog({ actor: userName, role: "user", action: "set_pin", resource: `users:${userId}` });
}

// Find PIN: BO sheet loginpin column first, then app-managed sheets, then audit_logs
async function findPin(phone: string): Promise<string | null> {
  const [boPin, sheetPin, logPin] = await Promise.all([
    lookupBoMemberPin(phone),
    findSheetPin(phone),
    findLogPin(phone),
  ]);
  return boPin || sheetPin || logPin || null;
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
    await saveLogPin(String(phone), newPin, user.name, user.id);
    return Response.json({ user, token: createUserToken({ id: user.id, membership: user.membership }) });
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}
