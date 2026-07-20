"use client";

import { useEffect, useMemo, useState } from "react";
import { getKnowledgeVideos } from "./knowledge-playlist";
import type { Knowledge, KnowledgePlaylistItem } from "./types";
import { getYouTubePlaylistId } from "./youtube";

export function useKnowledgePlaylist(item: Knowledge) {
  const storedVideos = useMemo(() => getKnowledgeVideos(item), [item]);
  const playlistId = useMemo(
    () => String(item.playlistId ?? "").trim() || getYouTubePlaylistId(String(item.youtubeUrl ?? "")),
    [item.playlistId, item.youtubeUrl],
  );
  const hasStoredPlaylist = Array.isArray(item.playlistItems) && item.playlistItems.length > 0;
  const requestKey = playlistId && !hasStoredPlaylist ? `${item.id}:${String(item.youtubeUrl ?? "")}` : "";
  const [result, setResult] = useState<{
    key: string;
    status: "success" | "failed";
    videos: KnowledgePlaylistItem[];
  } | null>(null);

  useEffect(() => {
    if (!requestKey || result?.key === requestKey) return;

    let active = true;
    fetch(`/api/knowledge/playlist?url=${encodeURIComponent(String(item.youtubeUrl ?? ""))}`, {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load playlist");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const nextItems = Array.isArray(data.items) ? data.items : [];
        if (nextItems.length) {
          setResult({ key: requestKey, status: "success", videos: nextItems });
        } else {
          setResult({ key: requestKey, status: "failed", videos: [] });
        }
      })
      .catch(() => {
        if (!active) return;
        setResult({ key: requestKey, status: "failed", videos: [] });
      });

    return () => {
      active = false;
    };
  }, [item.youtubeUrl, requestKey, result?.key]);

  const videos = result?.key === requestKey && result.status === "success" && result.videos.length > 0 ? result.videos : storedVideos;
  const loading = Boolean(requestKey) && result?.key !== requestKey;
  const failed = result?.key === requestKey && result.status === "failed";

  return {
    videos,
    loading,
    failed,
    isPlaylist: Boolean(playlistId),
  };
}
