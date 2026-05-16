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

export function normalizeImages(value: unknown): string[] {
  return normalizeCategories(value).map(normalizeImageUrl).filter(Boolean);
}

export function normalizeImageUrl(value: unknown): string {
  if (!value || typeof value !== "string") return "";

  const text = value.trim();
  if (!text) return "";

  const patterns = [
    /\/file\/d\/([^/]+)/,
    /[?&]id=([^&]+)/,
    /\/thumbnail\?id=([^&]+)/,
    /\/download\?id=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  if (/^[a-zA-Z0-9_-]{20,}$/.test(text)) {
    return `https://lh3.googleusercontent.com/d/${text}`;
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
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  if (/^[A-Za-z0-9_-]{20,}$/.test(text)) return text;
  return "";
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
  return value.map((item) => String(item).trim()).filter(Boolean);
}
