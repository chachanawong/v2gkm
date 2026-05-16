import { getGoogleAccessToken, hasGoogleServiceAccountConfig } from "./google-auth";
import { db } from "./mock-data";
import { normalizeCategories, normalizeImages } from "./normalize";
import { applyPublishWindow } from "./publish";
import type { Admin, AuditLog, Category, Knowledge, News, PreviewToken, Profile, ResourceType, User } from "./types";

type SheetMap = {
  users: User;
  admins: Admin;
  knowledge: Knowledge;
  profiles: Profile;
  news: News;
  categories: Category;
  audit_logs: AuditLog;
  preview_tokens: PreviewToken;
};

type SheetName = keyof SheetMap;

const sheetHeaders: Record<SheetName, string[]> = {
  users: ["id", "name", "phone", "membership", "uplinePlatinum", "active"],
  admins: ["id", "name", "email", "role", "password", "active"],
  knowledge: [
    "id",
    "title",
    "youtubeUrl",
    "youtubeId",
    "thumbnail",
    "categories",
    "uploadDate",
    "viewCount",
    "status",
    "visibility",
    "publishTime",
    "publishUntil",
    "createdAt",
    "updatedAt",
  ],
  profiles: ["id", "pin", "name", "bio", "position", "visibility", "images", "status", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories"],
  news: ["id", "title", "body", "images", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories"],
  categories: ["id", "name", "active"],
  audit_logs: ["id", "actor", "role", "action", "resource", "at"],
  preview_tokens: ["token", "resourceType", "resourceId", "expiresAt", "data"],
};

const resourceToSheet: Record<ResourceType, SheetName> = {
  users: "users",
  admins: "admins",
  knowledge: "knowledge",
  profiles: "profiles",
  news: "news",
  categories: "categories",
};

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const readCache = new Map<SheetName, { rows: unknown[]; expiresAt: number }>();
const readTtl = 15_000;

function hasSheetsConfig() {
  return Boolean(process.env.GOOGLE_SHEETS_ID && hasGoogleServiceAccountConfig());
}

async function sheetsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getGoogleAccessToken([sheetsScope]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_ID}${path}`, {
    ...init,
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`Google Sheets failed: ${response.status} ${await response.text()}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function valuesPath(range: string, suffix = "") {
  return `/values/${encodeURIComponent(range)}${suffix}`;
}

function parseValue(value: string, header?: string) {
  if (header === "phone") return String(value ?? "").trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value?.startsWith("[") || value?.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  const maybeNumber = Number(value);
  return value !== "" && !Number.isNaN(maybeNumber) && /^\d+$/.test(value) ? maybeNumber : value;
}

function rowsToObjects<T>(headers: string[], rows: string[][] = []) {
  return rows.map((row) => normalizeSheetItem(
    headers.reduce((item, header, index) => {
      return { ...item, [header]: parseValue(row[index] ?? "", header) };
    }, {} as Record<string, unknown>),
  ) as T);
}

function objectToRow<T>(headers: string[], item: T) {
  return headers.map((header) => {
    const value = (item as Record<string, unknown>)[header];
    if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value);
    return value ?? "";
  });
}

function normalizeSheetItem(item: Record<string, unknown>) {

  if (process.env.NODE_ENV === "development") {
    console.log("[SHEETS RAW ITEM]", item);
  }

  if ("categories" in item) {
    item.categories = normalizeCategories(item.categories);
  }

  if ("images" in item) {
    item.images = normalizeImages(item.images);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[PARSED ITEM]", item);
  }

  return item;
}

function mockList<T extends SheetName>(sheet: T): SheetMap[T][] {
  const map = {
    users: db.users,
    admins: db.admins,
    knowledge: db.knowledge.map((item) => applyPublishWindow(item)),
    profiles: db.profiles.map((item) => applyPublishWindow(item)),
    news: db.news.map((item) => applyPublishWindow(item)),
    categories: db.categories,
    audit_logs: db.auditLogs,
    preview_tokens: db.previewTokens,
  };
  return map[sheet] as SheetMap[T][];
}

function mockUpsert<T extends SheetName>(sheet: T, item: SheetMap[T]) {
  const map = {
    users: db.users,
    admins: db.admins,
    knowledge: db.knowledge,
    profiles: db.profiles,
    news: db.news,
    categories: db.categories,
    audit_logs: db.auditLogs,
    preview_tokens: db.previewTokens,
  };
  const rows = map[sheet] as unknown[];
  const idKey = sheet === "preview_tokens" ? "token" : "id";
  const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === String((item as Record<string, unknown>)[idKey]));
  if (index >= 0) rows[index] = item;
  else rows.unshift(item);
  return item;
}

export async function listSheet<T extends SheetName>(sheet: T): Promise<SheetMap[T][]> {
  if (!hasSheetsConfig()) return mockList(sheet);
  const cached = readCache.get(sheet);
  if (cached && cached.expiresAt > Date.now()) return cached.rows as SheetMap[T][];
  const response = await sheetsRequest<{ values?: string[][] }>(valuesPath(`${sheet}!A2:Z`));
  const rows = rowsToObjects<SheetMap[T]>(sheetHeaders[sheet], response.values);
  readCache.set(sheet, { rows, expiresAt: Date.now() + readTtl });
  return rows;
}

export async function batchListSheets<T extends SheetName>(sheets: T[]): Promise<Record<T, SheetMap[T][]>> {
  if (!hasSheetsConfig()) {
    return sheets.reduce((acc, sheet) => ({ ...acc, [sheet]: mockList(sheet) }), {} as Record<T, SheetMap[T][]>);
  }
  const query = sheets.map((sheet) => `ranges=${encodeURIComponent(`${sheet}!A2:Z`)}`).join("&");
  const response = await sheetsRequest<{ valueRanges?: { values?: string[][] }[] }>(`/values:batchGet?${query}`);
  return sheets.reduce((acc, sheet, index) => {
    const rows = response.valueRanges?.[index]?.values;
    const objects = rowsToObjects<SheetMap[T]>(sheetHeaders[sheet], rows);
    readCache.set(sheet, { rows: objects, expiresAt: Date.now() + readTtl });
    return { ...acc, [sheet]: objects };
  }, {} as Record<T, SheetMap[T][]>);
}

export async function upsertSheet<T extends SheetName>(sheet: T, item: SheetMap[T]) {
  if (!hasSheetsConfig()) return mockUpsert(sheet, item);
  const rows = await listSheet(sheet);
  const idKey = sheet === "preview_tokens" ? "token" : "id";
  const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === String((item as Record<string, unknown>)[idKey]));
  const values = [objectToRow(sheetHeaders[sheet], item)];
  if (index >= 0) {
    await sheetsRequest(valuesPath(`${sheet}!A${index + 2}:Z${index + 2}`, "?valueInputOption=RAW"), {
      method: "PUT",
      body: JSON.stringify({ values }),
    });
  } else {
    await sheetsRequest(valuesPath(`${sheet}!A:Z`, ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS"), {
      method: "POST",
      body: JSON.stringify({ values }),
    });
  }
  readCache.delete(sheet);
  return item;
}

export async function deleteFromSheet<T extends SheetName>(sheet: T, id: string) {
  if (!hasSheetsConfig()) {
    const map = {
      users: db.users,
      admins: db.admins,
      knowledge: db.knowledge,
      profiles: db.profiles,
      news: db.news,
      categories: db.categories,
      audit_logs: db.auditLogs,
      preview_tokens: db.previewTokens,
    };
    const rows = map[sheet] as unknown[];
    const idKey = sheet === "preview_tokens" ? "token" : "id";
    const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === id);
    if (index >= 0) rows.splice(index, 1);
    return true;
  }
  const rows = await listSheet(sheet);
  const idKey = sheet === "preview_tokens" ? "token" : "id";
  const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === id);
  if (index < 0) return false;
  await sheetsRequest(valuesPath(`${sheet}!A${index + 2}:Z${index + 2}`, ":clear"), {
    method: "POST",
    body: JSON.stringify({}),
  });
  readCache.delete(sheet);
  return true;
}

export async function listResource(resource: ResourceType) {
  return listSheet(resourceToSheet[resource]);
}

export async function upsertResource(resource: ResourceType, item: unknown) {
  const sheet = resourceToSheet[resource];
  return upsertSheet(sheet, item as never);
}

export async function deleteResource(resource: ResourceType, id: string) {
  return deleteFromSheet(resourceToSheet[resource], id);
}
