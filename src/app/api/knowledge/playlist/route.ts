import { getYouTubePlaylistId, getYouTubePlaylistItems } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const youtubeUrl = String(url.searchParams.get("url") ?? "").trim();

  if (!youtubeUrl) {
    return Response.json({ error: "Missing playlist url" }, { status: 400 });
  }

  const playlistId = getYouTubePlaylistId(youtubeUrl);
  if (!playlistId) {
    return Response.json({ error: "Invalid playlist url" }, { status: 400 });
  }

  const playlist = await getYouTubePlaylistItems(youtubeUrl);
  return Response.json({
    playlistId: playlist.playlistId,
    items: playlist.items,
  });
}
