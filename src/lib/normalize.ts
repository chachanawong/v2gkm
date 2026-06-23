export function normalizeCategories(value: unknown): string[] {
  if (Array.isArray(value)) return cleanList(value);
  if (value == null) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) return cleanList(parsed);
    } catch {
      return splitComma(text);
    }
  }
  return splitComma(text);
}

export function normalizeDateOnly(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString().slice(0, 10);
}

export function normalizeImages(value: unknown): string[] {
  return normalizeCategories(value).map(normalizeImageUrl).filter(Boolean);
}

export function normalizeImageUrl(value: unknown): string {
  if (!value || typeof value !== "string") return "";

  const text = value.trim();
  if (!text) return "";
  if (isLocalImageUrl(text) || isAppImageProxyUrl(text)) return text;

  const driveId = extractGoogleDriveId(text);
  if (driveId) {
    return buildImageProxyUrl(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveId)}`);
  }

  if (isAllowedRemoteImageUrl(text)) {
    return buildImageProxyUrl(text);
  }

  return text;
}

export function extractGoogleDriveId(value: string) {
  const text = value.trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?[^#]*id=([^&]+)/,
    /drive\.google\.com\/thumbnail\?[^#]*id=([^&]+)/,
    /lh3\.googleusercontent\.com\/d\/([^=?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text;
  return "";
}

function isLocalImageUrl(value: string) {
  return value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:");
}

function isAppImageProxyUrl(value: string) {
  return value.startsWith("/api/image?");
}

function isAllowedRemoteImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return [
      "drive.google.com",
      "lh3.googleusercontent.com",
      "img.youtube.com",
      "i.ytimg.com",
      "images.unsplash.com",
    ].includes(url.hostname);
  } catch {
    return false;
  }
}

function buildImageProxyUrl(src: string) {
  return `/api/image?src=${encodeURIComponent(src)}`;
}

export function getPrimaryImage(item: unknown): string {
  const record = (item ?? {}) as Record<string, unknown>;
  return normalizeImageUrl(
    normalizeImages(record.images)[0] ??
    record.imageUrl ??
    record.image ??
    record.thumbnail ??
    "",
  );
}

function splitComma(value: string) {
  return cleanList(value.split(","));
}

function cleanList(value: unknown[]) {
  return value
    .map((item) => String(item).trim())
    .filter((item) => item && !isJavaObjectReference(item));
}

function isJavaObjectReference(value: string) {
  return /^\[L[\w.$]+;@[0-9a-f]+$/i.test(value);
}
