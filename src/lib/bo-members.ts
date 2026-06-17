import type { Membership, User } from "./types";

const appScriptUrl = "https://script.google.com/macros/s/AKfycbzhQemA6bx5bYJGi3_LW2RYkOeIJuoqyuXHK_3TVl9rbN-WUmVeDGwxe_VF1S4OvCai/exec";
const cacheTtl = 30_000;

type BoMemberRecord = {
  id: string;
  createdAt?: string;
  date?: string;
  time?: string;
  name: string;
  nickname?: string;
  upline?: string;
  phone: string;
  memberType?: string;
  loginpin?: string;
  memberpin?: string;
  pin?: string;
  status?: string;
};

let cache: { rows: BoMemberRecord[]; expiresAt: number } | null = null;

function normalizePhone(value: string) {
  return String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeMembershipFromRecord(record: BoMemberRecord): Membership {
  const pin = normalizeText(record.memberpin || record.pin).toLowerCase();
  if (pin === "silver" || pin === "silver_up" || pin === "silver up") return "silver";
  if (pin === "platinum" || pin === "platinum_up" || pin === "platinum up") return "platinum";

  const memberType = normalizeText(record.memberType).toLowerCase();
  if (memberType === "silver_up" || memberType === "silver up" || memberType === "silver") return "silver";

  return "general";
}

async function scriptGet<T>(params: Record<string, string>): Promise<T> {
  const secret = process.env.GOOGLE_SCRIPT_SECRET;
  if (!secret) throw new Error("GOOGLE_SCRIPT_SECRET is required for bo_members access.");
  const query = new URLSearchParams({ secret, ...params }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const response = await fetch(`${appScriptUrl}?${query}`, {
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`bo_members GET failed: ${response.status}`);
  const data = await response.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) {
    throw new Error(`bo_members script error: ${((data as unknown) as { error: string }).error}`);
  }
  return data;
}

async function scriptPost<T>(body: Record<string, unknown>): Promise<T> {
  const secret = process.env.GOOGLE_SCRIPT_SECRET;
  if (!secret) throw new Error("GOOGLE_SCRIPT_SECRET is required for bo_members access.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const response = await fetch(appScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, ...body }),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`bo_members POST failed: ${response.status}`);
  const data = await response.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) {
    throw new Error(`bo_members script error: ${((data as unknown) as { error: string }).error}`);
  }
  return data;
}

export async function listBoMembers(): Promise<BoMemberRecord[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.rows;
  const rows = await scriptGet<BoMemberRecord[]>({ sheet: "bo_members" });
  cache = { rows, expiresAt: Date.now() + cacheTtl };
  return rows;
}

function toUser(record: BoMemberRecord): User {
  return {
    id: normalizeText(record.id) || `bo-${normalizePhone(record.phone)}`,
    name: normalizeText(record.name),
    phone: normalizeText(record.phone),
    membership: normalizeMembershipFromRecord(record),
    uplinePlatinum: normalizeText(record.upline),
    active: normalizeStatus(record.status) !== "inactive",
    loginPin: normalizeText(record.loginpin),
  };
}

export async function listBoUsers(): Promise<User[]> {
  const rows = await listBoMembers();
  return rows.map(toUser);
}

export async function lookupBoMember(phone: string): Promise<User | null> {
  const users = await listBoUsers();
  const normalizedPhone = normalizePhone(phone);
  return users.find((user) => normalizePhone(user.phone) === normalizedPhone && user.active !== false) ?? null;
}

export async function lookupBoMemberPin(phone: string): Promise<string | null> {
  const rows = await listBoMembers();
  const normalizedPhone = normalizePhone(phone);
  const member = rows.find((row) => normalizePhone(row.phone) === normalizedPhone && normalizeStatus(row.status) !== "inactive");
  const loginpin = normalizeText(member?.loginpin);
  return loginpin || null;
}

export async function updateBoMemberLoginPin(phone: string, loginpin: string) {
  const rows = await listBoMembers();
  const normalizedPhone = normalizePhone(phone);
  const member = rows.find((row) => normalizePhone(row.phone) === normalizedPhone);
  if (!member) throw new Error("ไม่พบสมาชิกใน bo_members");

  const next: BoMemberRecord = {
    ...member,
    phone: normalizeText(member.phone),
    loginpin: normalizeText(loginpin),
  };

  await scriptPost({
    action: "upsert",
    sheet: "bo_members",
    item: next,
  });
  clearBoMembersCache();
  return next;
}

export function clearBoMembersCache() {
  cache = null;
}
