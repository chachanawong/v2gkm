import nextEnv from "@next/env";
import { createSign } from "node:crypto";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

const headers = {
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
  news: ["id", "title", "body", "eventDate", "eventTime", "eventChannel", "images", "status", "visibility", "publishTime", "publishUntil", "createdAt", "updatedAt", "categories", "pinned"],
  categories: ["id", "name", "active"],
  events: ["id", "title", "description", "eventType", "startDate", "endDate", "location", "capacity", "images", "visibility", "status", "pinned", "createdAt", "updatedAt"],
  event_registrations: ["id", "eventId", "userId", "userName", "userPhone", "status", "createdAt"],
  learning_paths: ["id", "title", "description", "thumbnail", "visibility", "status", "order", "createdAt", "updatedAt"],
  lessons: ["id", "pathId", "title", "description", "youtubeUrl", "youtubeId", "thumbnail", "order", "quiz", "passingScore", "status", "createdAt", "updatedAt"],
  user_progress: ["id", "userId", "lessonId", "pathId", "completed", "quizScore", "completedAt"],
  audit_logs: ["id", "actor", "role", "action", "resource", "at"],
  preview_tokens: ["token", "resourceType", "resourceId", "expiresAt", "data"],
  bo_members: ["id", "createdAt", "date", "time", "name", "nickname", "upline", "phone", "memberType", "loginpin", "pin", "status"],
};

const now = new Date().toISOString();
const seedRows = {
  admins: [["a-001", "Admin V2G", "admin@v2g.local", "Admin", "admin1234", true]],
  categories: [
    ["c-001", "Business", "true"],
    ["c-002", "Mindset", "true"],
    ["c-003", "Training", "true"],
    ["c-004", "Leadership", "true"],
  ],
  knowledge: [
    [
      "k-001",
      "V2G Foundation",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "dQw4w9WgXcQ",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      JSON.stringify(["Training", "Business"]),
      "2026-05-01",
      "12450",
      "published",
      "general",
      "2026-05-01T01:00:00.000Z",
      "",
      now,
      now,
    ],
    [
      "k-002",
      "Silver Growth Playbook",
      "https://www.youtube.com/watch?v=ysz5S6PUM-U",
      "ysz5S6PUM-U",
      "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
      JSON.stringify(["Mindset"]),
      "2026-05-04",
      "8420",
      "published",
      "silver",
      "2026-05-04T01:00:00.000Z",
      "",
      now,
      now,
    ],
    [
      "k-003",
      "Platinum Strategy Room",
      "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      "jNQXAC9IVRw",
      "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
      JSON.stringify(["Leadership"]),
      "2026-05-08",
      "5330",
      "published",
      "platinum",
      "2026-05-08T01:00:00.000Z",
      "",
      now,
      now,
    ],
  ],
  news: [
    [
      "n-001",
      "V2G Weekly Update",
      "สรุปข่าวประจำสัปดาห์\nกิจกรรมใหม่เปิดให้ลงทะเบียนแล้ว\nติดตามรายละเอียดเพิ่มเติมในระบบ",
      "",
      "",
      "",
      JSON.stringify(["/window.svg"]),
      "published",
      "general",
      "2026-05-03T01:00:00.000Z",
      "",
      now,
      now,
      JSON.stringify(["Business"]),
      false,
    ],
  ],
  profiles: [
    [
      "p-001",
      "101",
      "Kanda S.",
      "ดูแลการเริ่มต้นธุรกิจและการวางระบบทีม\nเชี่ยวชาญการสื่อสารกับสมาชิกใหม่",
      "Business Mentor",
      "general",
      JSON.stringify(["/window.svg", "/globe.svg"]),
      "published",
      "2026-05-01T01:00:00.000Z",
      "",
      now,
      now,
    ],
  ],
  audit_logs: [["log-001", "system", "system", "setup sheets", "all", now]],
  preview_tokens: [["demo-preview-token", "news", "n-001", "2030-01-01T00:00:00.000Z", ""]],
  bo_members: [],
};

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
  return process.env[name];
}

let cachedToken = null;

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"), "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error(`Google auth failed: ${await response.text()}`);
  const data = await response.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function sheetsRequest(path, init = {}) {
  const token = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Google Sheets failed: ${response.status} ${await response.text()}`);
  return response.json();
}

function valuesPath(range, suffix = "") {
  return `/values/${encodeURIComponent(range)}${suffix}`;
}

function withTimeout(promise, label, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function main() {
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEETS_ID");
  console.log("Checking Google Sheets access...");
  await withTimeout(getAccessToken(), "Google auth");
  console.log("Auth OK");
  const meta = await withTimeout(sheetsRequest("?fields=properties.title,sheets.properties(sheetId,title)"), "Spreadsheet metadata");
  console.log(`Connected to ${meta.properties.title}`);
  const existing = new Map(meta.sheets.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
  const missing = Object.keys(headers).filter((name) => !existing.has(name));

  if (missing.length) {
    console.log(`Creating missing sheets: ${missing.join(", ")}`);
    await withTimeout(sheetsRequest(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      }),
    }), "Create missing sheets", 30000);
  }

  for (const [name, header] of Object.entries(headers)) {
    console.log(`Checking ${name}`);
    const response = await withTimeout(sheetsRequest(valuesPath(`${name}!A1:Z`)).catch(() => ({ values: [] })), `Read ${name}`);
    const values = response.values ?? [];
    if (!values.length) {
      await withTimeout(sheetsRequest(valuesPath(`${name}!A1`, "?valueInputOption=RAW"), {
        method: "PUT",
        body: JSON.stringify({ values: [header, ...(seedRows[name] ?? [])] }),
      }), `Seed ${name}`);
    } else {
      await withTimeout(sheetsRequest(valuesPath(`${name}!A1`, "?valueInputOption=RAW"), {
        method: "PUT",
        body: JSON.stringify({ values: [header] }),
      }), `Update header ${name}`);
    }
  }

  const finalMeta = await withTimeout(sheetsRequest("?fields=properties.title,sheets.properties.title"), "Final metadata");
  console.log(JSON.stringify({
    title: finalMeta.properties.title,
    sheets: finalMeta.sheets.map((sheet) => sheet.properties.title),
  }, null, 2));
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(error.response?.data ?? error.message);
  process.exit(1);
});
