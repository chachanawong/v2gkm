import type { KnowledgePlaylistItem } from "./types";

export function extractYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match?.[1] ?? "";
}

export function getYouTubeId(url: string) {
  return extractYouTubeId(url) || "dQw4w9WgXcQ";
}

export function getYouTubePlaylistId(url: string) {
  try {
    const parsed = new URL(url);
    const list = parsed.searchParams.get("list");
    return list?.trim() ?? "";
  } catch {
    const match = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
    return match?.[1] ?? "";
  }
}

export function getYouTubeThumbnail(url: string) {
  const id = getYouTubeId(url);
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export async function getYouTubeMetadata(url: string) {
  const id = getYouTubeId(url);
  if (!process.env.YOUTUBE_API_KEY) {
    return {
      youtubeId: id,
      thumbnail: getYouTubeThumbnail(url),
    };
  }
  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
  endpoint.searchParams.set("part", "snippet,statistics");
  endpoint.searchParams.set("id", id);
  endpoint.searchParams.set("key", process.env.YOUTUBE_API_KEY);
  const response = await fetch(endpoint, { next: { revalidate: 3600 } });
  if (!response.ok) return { youtubeId: id, thumbnail: getYouTubeThumbnail(url) };
  const data = await response.json();
  const video = data.items?.[0];
  return {
    youtubeId: id,
    thumbnail: video?.snippet?.thumbnails?.high?.url ?? getYouTubeThumbnail(url),
    uploadDate: video?.snippet?.publishedAt?.slice(0, 10),
    viewCount: Number(video?.statistics?.viewCount ?? 0),
  };
}

export async function getYouTubePlaylistItems(url: string) {
  const playlistId = getYouTubePlaylistId(url);
  if (!playlistId || !process.env.YOUTUBE_API_KEY) {
    return { playlistId, items: [] as KnowledgePlaylistItem[] };
  }

  type YouTubePlaylistApiItem = {
    id?: string;
    snippet?: {
      title?: string;
      position?: number;
      publishedAt?: string;
      resourceId?: { videoId?: string };
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
  };

  const items: KnowledgePlaylistItem[] = [];
  let pageToken = "";

  do {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    endpoint.searchParams.set("part", "snippet,contentDetails");
    endpoint.searchParams.set("playlistId", playlistId);
    endpoint.searchParams.set("maxResults", "50");
    endpoint.searchParams.set("key", process.env.YOUTUBE_API_KEY);
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);

    const response = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!response.ok) break;

    const data = await response.json();
    const nextItems: YouTubePlaylistApiItem[] = Array.isArray(data.items) ? data.items : [];
    items.push(
      ...nextItems.reduce<KnowledgePlaylistItem[]>((playlistItems, item) => {
          const youtubeId = item.snippet?.resourceId?.videoId ?? "";
          if (!youtubeId) return playlistItems;
          playlistItems.push({
            id: item.id ?? `${playlistId}-${youtubeId}`,
            title: item.snippet?.title?.trim() || `Video ${Number(item.snippet?.position ?? 0) + 1}`,
            youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}&list=${playlistId}`,
            youtubeId,
            thumbnail:
              item.snippet?.thumbnails?.high?.url
              ?? item.snippet?.thumbnails?.medium?.url
              ?? item.snippet?.thumbnails?.default?.url
              ?? getYouTubeThumbnail(`https://www.youtube.com/watch?v=${youtubeId}`),
            position: Number(item.snippet?.position ?? items.length),
            publishedAt: item.snippet?.publishedAt?.slice(0, 10),
          });
          return playlistItems;
        }, []),
    );

    pageToken = String(data.nextPageToken ?? "");
  } while (pageToken);

  return {
    playlistId,
    items: items.sort((a, b) => a.position - b.position),
  };
}
