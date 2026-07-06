export function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return match?.[1] ?? "dQw4w9WgXcQ";
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
