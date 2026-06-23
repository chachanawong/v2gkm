import { extractGoogleDriveId } from "@/lib/normalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedHosts = new Set([
  "drive.google.com",
  "lh3.googleusercontent.com",
  "img.youtube.com",
  "i.ytimg.com",
  "images.unsplash.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim();

  if (!src) {
    return Response.json({ error: "Missing src" }, { status: 400 });
  }

  const candidates = buildSourceCandidates(src);
  if (candidates.length === 0) {
    return Response.json({ error: "Unsupported image source" }, { status: 400 });
  }

  for (const candidate of candidates) {
    const response = await fetchRemoteImage(candidate);
    if (!response) continue;
    return response;
  }

  return Response.json({ error: "Unable to fetch image" }, { status: 502 });
}

function buildSourceCandidates(src: string) {
  try {
    const url = new URL(src);
    if (!allowedHosts.has(url.hostname)) return [];

    const driveId = extractGoogleDriveId(src);
    if (driveId) {
      return [
        `https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveId)}`,
        `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1600`,
        `https://lh3.googleusercontent.com/d/${encodeURIComponent(driveId)}`,
        src,
      ];
    }

    return [src];
  } catch {
    return [];
  }
}

async function fetchRemoteImage(src: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const upstream = await fetch(src, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; V2GKM Image Proxy/1.0)",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });

    if (!upstream.ok) return null;

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const bytes = await upstream.arrayBuffer();
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
