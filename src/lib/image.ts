const IMAGE_FIELDS = [
  "images",
  "imageUrls",
  "image_urls",
  "imageUrl",
  "image_url",
  "image",
  "thumbnail",
  "thumbnailUrl",
  "thumbnail_url",
  "gallery",
]

export function extractDriveFileId(value: unknown): string | null {
  if (!value || typeof value !== "string") return null

  const text = value.trim()

  const patterns = [
    /\/file\/d\/([^/]+)/,
    /[?&]id=([^&]+)/,
    /\/d\/([^/?]+)/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  if (/^[a-zA-Z0-9_-]{20,}$/.test(text)) {
    return text
  }

  return null
}

export function normalizeImageUrl(value: unknown): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  const driveId = extractDriveFileId(text);

  if (driveId) {

    // DEBUG
    console.log("[NORMALIZE DRIVE IMAGE]", {
      original: text,
      driveId,
      normalized: `https://lh3.googleusercontent.com/d/${driveId}`,
    });

    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return text;
}

function parseImageValue(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.flatMap(parseImageValue)
  }

  if (typeof value !== "string") return []

  const text = value.trim()
  if (!text) return []

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.flatMap(parseImageValue)
    }
  } catch {}

  if (text.includes(",")) {
    return text.split(",").flatMap(parseImageValue)
  }

  return [text]
}

export function normalizeImagesFromItem(item: any): string[] {
  const allValues = IMAGE_FIELDS.flatMap((field) => {
    return parseImageValue(item?.[field])
  })

  return Array.from(
    new Set(
      allValues
        .map(normalizeImageUrl)
        .filter((url): url is string => Boolean(url))
    )
  )
}

export function getPrimaryImage(item: any): string | null {
  return normalizeImagesFromItem(item)[0] || null
}