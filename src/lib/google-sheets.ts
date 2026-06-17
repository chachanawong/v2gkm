import { getGoogleAccessToken, hasGoogleServiceAccountConfig } from "./google-auth";
import { db } from "./mock-data";
import { normalizeCategories, normalizeImages } from "./normalize";
import { applyPublishWindow } from "./publish";
import type { Admin, AuditLog, Category, Event, EventRegistration, Knowledge, Lesson, LearningPath, News, PreviewToken, Profile, Register, ResourceType, User, UserPin, UserProgress } from "./types";

type SheetMap = {
  users: User;
  admins: Admin;
  knowledge: Knowledge;
  profiles: Profile;
  news: News;
  categories: Category;
  events: Event;
  event_registrations: EventRegistration;
  learning_paths: LearningPath;
  lessons: Lesson;
  user_progress: UserProgress;
  audit_logs: AuditLog;
  preview_tokens: PreviewToken;
  user_pins: UserPin;
  register: Register;
};

type SheetName = keyof SheetMap;

const sheetHeaders: Record<SheetName, string[]> = {
  users: ["id", "name", "phone", "membership", "uplinePlatinum", "active", "loginPin"],
  admins: ["id", "name", "email", "role", "password", "active"],
  knowledge: ["id", "title", "youtubeUrl", "youtubeId", "thumbnail", "categories", "uploadDate", "viewCount", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt"],
  profiles: ["id", "pin", "name", "bio", "position", "visibility", "images", "status", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories"],
  news: ["id", "title", "body", "eventDate", "eventTime", "eventChannel", "images", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories", "pinned"],
  categories: ["id", "name", "active"],
  events: ["id", "title", "description", "eventType", "startDate", "endDate", "location", "capacity", "images", "visibility", "status", "pinned", "createdAt", "updatedAt"],
  event_registrations: ["id", "eventId", "userId", "userName", "userPhone", "status", "createdAt"],
  learning_paths: ["id", "title", "description", "thumbnail", "visibility", "status", "order", "createdAt", "updatedAt"],
  lessons: ["id", "pathId", "title", "description", "youtubeUrl", "youtubeId", "thumbnail", "order", "quiz", "passingScore", "status", "createdAt", "updatedAt"],
  user_progress: ["id", "userId", "lessonId", "pathId", "completed", "quizScore", "completedAt"],
  audit_logs: ["id", "actor", "role", "action", "resource", "at"],
  preview_tokens: ["token", "resourceType", "resourceId", "expiresAt", "data"],
  user_pins: ["phone", "loginPin"],
  register: ["phone", "loginpin"],
};

const resourceToSheet: Record<ResourceType, SheetName> = {
  users: "users",
  admins: "admins",
  knowledge: "knowledge",
  profiles: "profiles",
  news: "news",
  categories: "categories",
  events: "events",
  learning_paths: "learning_paths",
  lessons: "lessons",
};

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const readCache = new Map<SheetName, { rows: unknown[]; expiresAt: number }>();
const readTtl = 15_000;

function getPrimarySpreadsheetId() {
  return process.env.GOOGLE_SHEETS_ID || "";
}

function hasScriptConfig() {
  return Boolean(process.env.GOOGLE_SCRIPT_URL && process.env.GOOGLE_SCRIPT_SECRET);
}

function hasSheetsConfig() {
  return Boolean(getPrimarySpreadsheetId() && hasGoogleServiceAccountConfig());
}

async function scriptGet<T>(params: Record<string, string>): Promise<T> {
  const url = process.env.GOOGLE_SCRIPT_URL!;
  const secret = process.env.GOOGLE_SCRIPT_SECRET!;
  const qs = new URLSearchParams({ secret, ...params }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const res = await fetch(`${url}?${qs}`, { cache: "no-store", signal: controller.signal }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`Script GET failed: ${res.status}`);
  const data = await res.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) throw new Error(`Script error: ${(data as unknown as { error: string }).error}`);
  return data;
}

async function scriptPost<T>(body: Record<string, unknown>): Promise<T> {
  const url = process.env.GOOGLE_SCRIPT_URL!;
  const secret = process.env.GOOGLE_SCRIPT_SECRET!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, ...body }),
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!res.ok) throw new Error(`Script POST failed: ${res.status}`);
  const data = await res.json() as T;
  if (data && typeof data === "object" && "error" in (data as object)) throw new Error(`Script error: ${(data as unknown as { error: string }).error}`);
  return data;
}

async function sheetsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getGoogleAccessToken([sheetsScope]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const spreadsheetId = getPrimarySpreadsheetId();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`, {
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
    events: db.events,
    event_registrations: db.eventRegistrations,
    learning_paths: db.learningPaths,
    lessons: db.lessons,
    user_progress: db.userProgress,
    audit_logs: db.auditLogs,
    preview_tokens: db.previewTokens,
    user_pins: db.userPins,
    register: [],
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
    events: db.events,
    event_registrations: db.eventRegistrations,
    learning_paths: db.learningPaths,
    lessons: db.lessons,
    user_progress: db.userProgress,
    audit_logs: db.auditLogs,
    preview_tokens: db.previewTokens,
    user_pins: db.userPins,
    register: [],
  };
  const rows = map[sheet] as unknown[];
  const idKey = sheet === "preview_tokens" ? "token" : (sheet === "user_pins" || sheet === "register") ? "phone" : "id";
  const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === String((item as Record<string, unknown>)[idKey]));
  if (index >= 0) rows[index] = item;
  else rows.unshift(item);
  return item;
}

function normalizeScriptRows<T extends SheetName>(sheet: T, rows: Record<string, unknown>[]): SheetMap[T][] {
  return rows.map((row) => normalizeSheetItem(
    sheetHeaders[sheet].reduce((acc, key) => {
      const raw = row[key];
      acc[key] = parseValue(raw === undefined || raw === null ? "" : String(raw), key);
      return acc;
    }, {} as Record<string, unknown>),
  ) as SheetMap[T]);
}

export async function listSheet<T extends SheetName>(sheet: T): Promise<SheetMap[T][]> {
  const cached = readCache.get(sheet);
  if (cached && cached.expiresAt > Date.now()) return cached.rows as SheetMap[T][];
  if (hasScriptConfig()) {
    const rows = await scriptGet<Record<string, unknown>[]>({ sheet });
    const objects = normalizeScriptRows(sheet, rows);
    readCache.set(sheet, { rows: objects, expiresAt: Date.now() + readTtl });
    return objects;
  }
  if (hasSheetsConfig()) {
    const response = await sheetsRequest<{ values?: string[][] }>(valuesPath(`${sheet}!A2:Z`));
    const rows = rowsToObjects<SheetMap[T]>(sheetHeaders[sheet], response.values);
    readCache.set(sheet, { rows, expiresAt: Date.now() + readTtl });
    return rows;
  }
  return mockList(sheet);
}

export async function batchListSheets<T extends SheetName>(sheets: T[]): Promise<Record<T, SheetMap[T][]>> {
  if (hasScriptConfig()) {
    const querySheets = sheets.filter((sheet, index) => sheets.indexOf(sheet) === index);
    const scriptResult = querySheets.length > 0
      ? await scriptGet<Record<string, Record<string, unknown>[]>>({ sheets: querySheets.join(",") })
      : ({} as Record<string, Record<string, unknown>[]>);
    return sheets.reduce((acc, sheet) => {
      const objects = normalizeScriptRows(sheet, scriptResult[sheet] ?? []);
      readCache.set(sheet, { rows: objects, expiresAt: Date.now() + readTtl });
      return { ...acc, [sheet]: objects };
    }, {} as Record<T, SheetMap[T][]>);
  }
  if (hasSheetsConfig()) {
    const query = sheets.map((sheet) => `ranges=${encodeURIComponent(`${sheet}!A2:Z`)}`).join("&");
    const response = await sheetsRequest<{ valueRanges?: { values?: string[][] }[] }>(`/values:batchGet?${query}`);
    return sheets.reduce((acc, sheet, index) => {
      const rows = response.valueRanges?.[index]?.values;
      const objects = rowsToObjects<SheetMap[T]>(sheetHeaders[sheet], rows);
      readCache.set(sheet, { rows: objects, expiresAt: Date.now() + readTtl });
      return { ...acc, [sheet]: objects };
    }, {} as Record<T, SheetMap[T][]>);
  }
  return sheets.reduce((acc, sheet) => ({ ...acc, [sheet]: mockList(sheet) }), {} as Record<T, SheetMap[T][]>);
}

export async function upsertSheet<T extends SheetName>(sheet: T, item: SheetMap[T]) {
  if (hasScriptConfig()) {
    await scriptPost({ action: "upsert", sheet, item });
    readCache.delete(sheet);
    return item;
  }
  if (!hasSheetsConfig()) return mockUpsert(sheet, item);
  const rows = await listSheet(sheet);
  const idKey = sheet === "preview_tokens" ? "token" : (sheet === "user_pins" || sheet === "register") ? "phone" : "id";
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
  if (hasScriptConfig()) {
    await scriptPost({ action: "delete", sheet, id });
    readCache.delete(sheet);
    return true;
  }
  if (!hasSheetsConfig()) {
    const map = {
      users: db.users,
      admins: db.admins,
      knowledge: db.knowledge,
      profiles: db.profiles,
      news: db.news,
      categories: db.categories,
      events: db.events,
      event_registrations: db.eventRegistrations,
      learning_paths: db.learningPaths,
      lessons: db.lessons,
      user_progress: db.userProgress,
      audit_logs: db.auditLogs,
      preview_tokens: db.previewTokens,
      user_pins: db.userPins,
      register: [] as import("./types").Register[],
    };
    const rows = map[sheet] as unknown[];
    const idKey = sheet === "preview_tokens" ? "token" : (sheet === "user_pins" || sheet === "register") ? "phone" : "id";
    const index = rows.findIndex((row) => String((row as Record<string, unknown>)[idKey]) === id);
    if (index >= 0) rows.splice(index, 1);
    return true;
  }
  const rows = await listSheet(sheet);
  const idKey = sheet === "preview_tokens" ? "token" : (sheet === "user_pins" || sheet === "register") ? "phone" : "id";
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
