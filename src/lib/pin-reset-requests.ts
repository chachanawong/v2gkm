import { getGoogleScriptUrl } from "./google-script";
import type { PinResetRequest } from "./types";

function requireSecret() {
  const secret = process.env.GOOGLE_SCRIPT_SECRET;
  if (!secret) {
    throw new Error("GOOGLE_SCRIPT_SECRET is required for pin reset requests.");
  }
  return secret;
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePinResetRequest(row: Record<string, unknown>): PinResetRequest {
  return {
    id: normalizeText(row.id),
    phone: normalizeText(row.phone),
    userId: normalizeText(row.userId),
    userName: normalizeText(row.userName),
    status: (normalizeText(row.status) || "pending") as PinResetRequest["status"],
    requestedAt: normalizeText(row.requestedAt),
    resolvedAt: normalizeText(row.resolvedAt),
    resolvedBy: normalizeText(row.resolvedBy),
    note: normalizeText(row.note),
  };
}

async function scriptGet<T>(params: Record<string, string>) {
  const query = new URLSearchParams({ secret: requireSecret(), ...params }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const response = await fetch(`${getGoogleScriptUrl()}?${query}`, {
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`pin reset request GET failed: ${response.status}`);
  }

  const data = await response.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) {
    throw new Error(`pin reset request script error: ${((data as unknown) as { error: string }).error}`);
  }
  return data;
}

async function scriptPost<T>(body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const response = await fetch(getGoogleScriptUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: requireSecret(), ...body }),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`pin reset request POST failed: ${response.status}`);
  }

  const data = await response.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) {
    throw new Error(`pin reset request script error: ${((data as unknown) as { error: string }).error}`);
  }
  return data;
}

export async function listPinResetRequests() {
  const rows = await scriptGet<Record<string, unknown>[]>({ sheet: "pin_reset_requests" });
  return rows.map(normalizePinResetRequest);
}

export async function listPendingPinResetRequests() {
  const rows = await listPinResetRequests();
  return rows
    .filter((item) => item.status === "pending")
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function upsertPinResetRequest(item: PinResetRequest) {
  await scriptPost({
    action: "upsert",
    sheet: "pin_reset_requests",
    item,
  });
  return item;
}
