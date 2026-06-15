import { getGoogleAccessToken, hasGoogleServiceAccountConfig } from "./google-auth";
import type { User } from "./types";

const BO_SHEET_ID = process.env.BO_SHEETS_ID ?? "1OPmj4G0DdUzHnt-ORBN6ZQRegBfhEhERqUhud7u1SZk";
const BO_TAB = "bo_members";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const CACHE_TTL = 30_000;

type BoRow = {
  phone: string;
  name: string;
  membership: string;
  active: boolean;
  id?: string;
};

let cache: { rows: BoRow[]; expiresAt: number } | null = null;

function normalizePhone(v: string) {
  return String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function colIndex(headers: string[], names: string[]) {
  return (
    names
      .map((n) => headers.findIndex((h) => h.toLowerCase().trim() === n.toLowerCase()))
      .find((i) => i >= 0) ?? -1
  );
}

async function fetchBoRows(): Promise<BoRow[]> {
  if (!hasGoogleServiceAccountConfig()) return [];
  if (cache && cache.expiresAt > Date.now()) return cache.rows;

  const token = await getGoogleAccessToken([SHEETS_SCOPE]);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${BO_SHEET_ID}/values/${encodeURIComponent(`${BO_TAB}!A1:Z`)}`,
    { signal: ctrl.signal, headers: { Authorization: `Bearer ${token}` } },
  ).finally(() => clearTimeout(timer));

  if (!res.ok) {
    console.error("[bo_members] fetch error:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as { values?: string[][] };
  const [headerRow, ...dataRows] = data.values ?? [];
  if (!headerRow) return [];

  const phoneCol = colIndex(headerRow, ["phone", "mobile", "เบอร์โทร", "โทร", "tel"]);
  const nameCol = colIndex(headerRow, ["name", "ชื่อ", "ชื่อ-นามสกุล", "fullname"]);
  const activeCol = colIndex(headerRow, ["active", "status", "สถานะ", "is_active"]);
  const memberCol = colIndex(headerRow, ["membership", "tier", "ระดับ", "member_type", "level"]);
  const idCol = colIndex(headerRow, ["id", "member_id", "รหัสสมาชิก"]);

  const rows = dataRows
    .filter((r) => r.length > 0)
    .map((r): BoRow => {
      const rawActive = String(r[activeCol] ?? "").toLowerCase().trim();
      return {
        id: idCol >= 0 ? r[idCol] : undefined,
        phone: phoneCol >= 0 ? String(r[phoneCol] ?? "") : "",
        name: nameCol >= 0 ? String(r[nameCol] ?? "") : "",
        membership: memberCol >= 0 ? String(r[memberCol] ?? "general") : "general",
        active: ["true", "active", "yes", "1"].includes(rawActive),
      };
    });

  cache = { rows, expiresAt: Date.now() + CACHE_TTL };
  return rows;
}

function normalizeMembership(raw: string): User["membership"] {
  const v = raw.toLowerCase().trim();
  if (v === "platinum" || v === "แพลตตินัม") return "platinum";
  if (v === "silver" || v === "ซิลเวอร์") return "silver";
  return "general";
}

export async function lookupBoMember(phone: string): Promise<User | null> {
  const rows = await fetchBoRows();
  const norm = normalizePhone(phone);
  const found = rows.find((r) => normalizePhone(r.phone) === norm && r.active);
  if (!found) return null;
  return {
    id: found.id ?? `bo-${norm}`,
    name: found.name,
    phone: found.phone,
    membership: normalizeMembership(found.membership),
    active: true,
  };
}

export function clearBoCache() {
  cache = null;
}
