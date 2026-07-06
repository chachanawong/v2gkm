import { listSheet } from "./google-sheets";
import { lookupBoMember, lookupBoMemberPin } from "./bo-members";
import { canAccessResource } from "./permissions";
import { getBearerToken, verifyToken } from "./session-token";
import type { Admin, AdminRole, ResourceType, User } from "./types";

export async function loginUser(phone: string): Promise<User | null> {
  return lookupBoMember(phone);
}

export async function findUserPin(phone: string): Promise<{ hash: string | null; legacyPin: string | null }> {
  return lookupBoMemberPin(phone);
}

export async function loginAdmin(email: string, password: string): Promise<Omit<Admin, "password"> | null> {
  const admins = await listSheet("admins");
  const admin = admins.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password && item.active !== false);
  if (!admin) return null;
  return { id: admin.id, name: admin.name, email: admin.email, role: normalizeAdminRole(admin.role) };
}

export function getAdminSession(request: Request) {
  const session = verifyToken(getBearerToken(request));
  return session?.kind === "admin" ? session : null;
}

export function assertAdminRequest(request: Request, resource?: ResourceType) {
  const session = getAdminSession(request);
  if (!session) {
    return Response.json({ error: "Admin session required" }, { status: 401 });
  }
  if (resource && !canAccessResource(session.role, resource)) {
    return Response.json({ error: "Permission denied" }, { status: 403 });
  }
  return null;
}

export function normalizeAdminRole(role: unknown): AdminRole {
  const value = String(role ?? "").toLowerCase();
  if (value === "admin" || value === "owner") return "Admin";
  if (value === "content" || value === "editor") return "Content";
  if (value === "account" || value === "staff") return "Account";
  return "Content";
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}
