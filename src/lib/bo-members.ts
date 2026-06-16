import type { User } from "./types";

const BO_SHEET_ID = process.env.BO_SHEETS_ID ?? "1OPmj4G0DdUzHnt-ORBN6ZQRegBfhEhERqUhud7u1SZk";
const BO_SHEET_GID = process.env.BO_SHEETS_GID ?? "1674022559";
const CACHE_TTL = 30_000;

type BoRow = {
  id: string;
  phone: string;
  name: string;
  membership: string;
  active: boolean;
  loginPin: string;
};

let cache: { rows: BoRow[]; expiresAt: number } | null = null;

function normalizePhone(v: string) {
  return String(v ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function normalizePin(pin: string): string {
  const v = String(pin ?? "").toLowerCase().trim();
  if (v === "silverup" || v === "silver") return "silver";
  if (v === "platifnumup" || v === "platinumup" || v === "platinum") return "platinum";
  return "general";
}

async function fetchGviz(): Promise<Record<string, unknown>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${BO_SHEET_ID}/gviz/tq?tqx=out:json&gid=${BO_SHEET_GID}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  const res = await fetch(url, { cache: "no-store", signal: ctrl.signal }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new Error(`gviz fetch failed: ${res.status}`);
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?\s*$/s);
  if (!match) throw new Error("gviz parse error");
  const data = JSON.parse(match[1]) as {
    table: { cols: { label: string }[]; rows: { c: ({ v: unknown } | null)[] }[] };
  };
  const cols = data.table.cols.map((c) => c.label);
  return data.table.rows.map((row) =>
    cols.reduce((acc, col, i) => ({ ...acc, [col]: row.c[i]?.v ?? "" }), {} as Record<string, unknown>),
  );
}

async function fetchBoRows(): Promise<BoRow[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.rows;
  try {
    const raw = await fetchGviz();
    const rows: BoRow[] = raw.map((r) => ({
      id: String(r.id ?? ""),
      phone: String(r.phone ?? ""),
      name: String(r.name ?? ""),
      membership: normalizePin(String(r.pin ?? "")),
      active: String(r.status ?? "").toLowerCase() === "active",
      loginPin: String(r.loginpin ?? "").trim(),
    }));
    cache = { rows, expiresAt: Date.now() + CACHE_TTL };
    return rows;
  } catch (err) {
    console.error("[bo_members] gviz fetch error:", err);
    return cache?.rows ?? [];
  }
}

export async function lookupBoMember(phone: string): Promise<User | null> {
  const rows = await fetchBoRows();
  const norm = normalizePhone(phone);
  const found = rows.find((r) => normalizePhone(r.phone) === norm && r.active);
  if (!found) return null;
  return {
    id: found.id || `bo-${norm}`,
    name: found.name,
    phone: found.phone,
    membership: (found.membership || "general") as import("./types").Membership,
    active: true,
  };
}

export async function lookupBoMemberPin(phone: string): Promise<string | null> {
  const rows = await fetchBoRows();
  const norm = normalizePhone(phone);
  const found = rows.find((r) => normalizePhone(r.phone) === norm && r.active);
  return found?.loginPin || null;
}

export function clearBoCache() {
  cache = null;
}
