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
  loginpin_hash?: string;
  memberpin?: string;
  pin?: string;
  status?: string;
};

type BoPaymentRecord = {
  id: string;
  createdAt?: string;
  date?: string;
  time?: string;
  name?: string;
  upline?: string;
  phone: string;
  memberType?: string;
  amount?: string | number;
  notes?: string;
  status?: string;
  slipUrl?: string;
  slipName?: string;
  ocrText?: string;
};

let cache: { rows: BoMemberRecord[]; expiresAt: number } | null = null;
let paymentCache = new Map<string, { rows: BoPaymentRecord[]; expiresAt: number }>();

function normalizePhone(value: string) {
  return String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function normalizeSheetPhone(value: string) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function isActiveBoMemberStatus(value: unknown) {
  return normalizeStatus(value) === "active";
}

function isOnlineMemberType(value: unknown) {
  return normalizeText(value).toLowerCase() === "online";
}

function isEligibleBoMember(record: BoMemberRecord) {
  return isActiveBoMemberStatus(record.status) && !isOnlineMemberType(record.memberType);
}

function normalizeMembershipFromRecord(record: BoMemberRecord): Membership {
  const memberPin = normalizeText(record.memberpin).toLowerCase();
  const memberType = normalizeText(record.memberType).toLowerCase();
  const membershipText = `${memberPin} ${memberType}`.trim();
  if (!membershipText) return "general";

  if (
    membershipText.includes("platinum") ||
    membershipText.includes("แพลตินัม") ||
    membershipText.includes("founder platinum")
  ) {
    return "platinum";
  }

  if (
    membershipText.includes("silver") ||
    membershipText.includes("ซิลเวอร์") ||
    membershipText.includes("founder silver")
  ) {
    return "silver";
  }

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
    active: isEligibleBoMember(record),
    hasLoginPin: Boolean(normalizeText(record.loginpin_hash) || normalizeText(record.loginpin)),
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

export async function findBoUserById(id: string): Promise<User | null> {
  const users = await listBoUsers();
  return users.find((user) => String(user.id) === String(id) && user.active !== false) ?? null;
}

export async function lookupBoMemberPin(phone: string): Promise<{ hash: string | null; legacyPin: string | null }> {
  const rows = await listBoMembers();
  const normalizedPhone = normalizePhone(phone);
  const member = rows.find((row) => normalizePhone(row.phone) === normalizedPhone && isEligibleBoMember(row));
  return {
    hash: normalizeText(member?.loginpin_hash) || null,
    legacyPin: normalizeText(member?.loginpin) || null,
  };
}

export async function updateBoMemberLoginPin(phone: string, loginpinHash: string) {
  const rows = await listBoMembers();
  const normalizedPhone = normalizePhone(phone);
  const member = rows.find((row) => normalizePhone(row.phone) === normalizedPhone);
  if (!member) throw new Error("ไม่พบสมาชิกใน bo_members");

  const normalizedHash = normalizeText(loginpinHash);
  try {
    await scriptPost({
      action: "setBoMemberLoginPin",
      phone: normalizeText(member.phone),
      loginpinHash: normalizedHash,
    });
  } catch {
    const next: BoMemberRecord = {
      ...member,
      phone: normalizeText(member.phone),
      loginpin: "",
      loginpin_hash: normalizedHash,
    };

    await scriptPost({
      action: "upsert",
      sheet: "bo_members",
      item: next,
    });
  }

  clearBoMembersCache();
  return {
    ...member,
    loginpin: "",
    loginpin_hash: normalizedHash,
  };
}

export async function clearBoMemberLoginPin(phone: string) {
  const rows = await listBoMembers();
  const normalizedPhone = normalizePhone(phone);
  const member = rows.find((row) => normalizePhone(row.phone) === normalizedPhone);
  if (!member) throw new Error("ไม่พบสมาชิกใน bo_members");

  try {
    await scriptPost({
      action: "clearBoMemberLoginPin",
      phone: normalizeText(member.phone),
    });
  } catch {
    const next: BoMemberRecord = {
      ...member,
      phone: normalizeText(member.phone),
      loginpin: "",
      loginpin_hash: "",
    };

    await scriptPost({
      action: "upsert",
      sheet: "bo_members",
      item: next,
    });
  }

  clearBoMembersCache();
  return {
    ...member,
    loginpin: "",
    loginpin_hash: "",
  };
}

export function clearBoMembersCache() {
  cache = null;
  paymentCache = new Map<string, { rows: BoPaymentRecord[]; expiresAt: number }>();
}

export async function listBoPaymentsByPhone(phone: string): Promise<BoPaymentRecord[]> {
  const normalizedPhone = normalizeSheetPhone(phone);
  if (!normalizedPhone) return [];

  const cached = paymentCache.get(normalizedPhone);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  const data = await scriptGet<{ payments?: BoPaymentRecord[] }>({
    action: "businessData",
    include: "payments",
    phone: normalizedPhone,
    fullRead: "false",
  });

  const rows = Array.isArray(data.payments)
    ? data.payments.filter((row) => normalizeSheetPhone(row.phone) === normalizedPhone)
    : [];

  paymentCache.set(normalizedPhone, { rows, expiresAt: Date.now() + cacheTtl });
  return rows;
}
