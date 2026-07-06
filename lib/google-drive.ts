const driveScope = "https://www.googleapis.com/auth/drive";
const adminUploadDriveFolderId = "1by5EUSXxgd39h1sN6CTXesfg77XYqMxk";

export type UploadedImage = {
  id?: string;
  name: string;
  url: string;
  directUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  storage: "google-drive" | "local";
};

let cachedDriveToken: { token: string; expiresAt: number } | null = null;

export function hasDriveConfig() {
  return Boolean(
    adminUploadDriveFolderId
      && process.env.GOOGLE_DRIVE_CLIENT_ID
      && process.env.GOOGLE_DRIVE_CLIENT_SECRET
      && process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  );
}

export function getDriveFolderId() {
  return adminUploadDriveFolderId;
}

export async function uploadImageToDrive({
  buffer,
  name,
  mimeType,
}: {
  buffer: Buffer;
  name: string;
  mimeType: string;
}): Promise<UploadedImage> {
  const folderId = getDriveFolderId();
  if (!folderId) throw new Error("Admin upload Drive folder ID is required for Drive uploads.");

  const token = await getDriveAccessToken();
  await assertWritableFolder(folderId, token);

  const boundary = `v2g-${crypto.randomUUID()}`;
  const metadata = {
    name: sanitizeName(name),
    mimeType,
    parents: [folderId],
  };
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const upload = await driveRequest<{ id: string; name: string; mimeType: string; size?: string }>(
    "/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    },
  );

  await driveRequest(`/drive/v3/files/${upload.id}/permissions?supportsAllDrives=true&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "anyone", role: "reader", allowFileDiscovery: false }),
  });

  return {
    id: upload.id,
    name: upload.name,
    url: publicImageUrl(upload.id),
    directUrl: publicImageUrl(upload.id),
    thumbnailUrl: thumbnailImageUrl(upload.id),
    mimeType: upload.mimeType,
    size: Number(upload.size ?? buffer.length),
    storage: "google-drive",
  };
}

async function getDriveAccessToken() {
  if (cachedDriveToken && cachedDriveToken.expiresAt > Date.now() + 60_000) return cachedDriveToken.token;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_DRIVE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_DRIVE_CLIENT_SECRET"),
      refresh_token: requireEnv("GOOGLE_DRIVE_REFRESH_TOKEN"),
      grant_type: "refresh_token",
      scope: driveScope,
    }),
  });
  if (!response.ok) throw new Error(`Google Drive OAuth failed: ${response.status} ${await response.text()}`);
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedDriveToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedDriveToken.token;
}

async function assertWritableFolder(folderId: string, token: string) {
  const folder = await driveRequest<{
    id: string;
    name: string;
    mimeType: string;
    capabilities?: { canAddChildren?: boolean };
  }>(
    `/drive/v3/files/${encodeURIComponent(folderId)}?supportsAllDrives=true&fields=id,name,mimeType,capabilities/canAddChildren`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (folder.mimeType !== "application/vnd.google-apps.folder") {
    throw new Error("Admin upload Drive folder ID must point to a Google Drive folder.");
  }
  if (folder.capabilities?.canAddChildren === false) {
    throw new Error("OAuth Google account cannot add files to the admin upload Google Drive folder. Grant access to that account or choose a folder it owns.");
  }
}

function publicImageUrl(id: string) {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}

function thumbnailImageUrl(id: string) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
}

function sanitizeName(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `${crypto.randomUUID()}.webp`;
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required for Google Drive OAuth uploads.`);
  return value;
}

async function driveRequest<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    const details = await response.text();
    console.error("Google Drive request failed", { status: response.status, path, details });
    throw new Error(`Google Drive failed: ${response.status} ${details}`);
  }
  return response.json() as Promise<T>;
}
