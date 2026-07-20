import type { Knowledge, KnowledgePlaylistItem } from "./types";

export function getKnowledgeVideos(item: Knowledge): KnowledgePlaylistItem[] {
  if (Array.isArray(item.playlistItems) && item.playlistItems.length > 0) {
    return item.playlistItems;
  }

  if (!item.youtubeId && !item.youtubeUrl) {
    return [];
  }

  return [{
    id: item.id,
    title: item.title,
    youtubeUrl: item.youtubeUrl,
    youtubeId: item.youtubeId,
    thumbnail: item.thumbnail,
    position: 0,
    publishedAt: item.uploadDate,
  }];
}

export function getKnowledgePrimaryVideo(item: Knowledge) {
  return getKnowledgeVideos(item)[0] ?? null;
}

export function getKnowledgeVideoCount(item: Knowledge) {
  return getKnowledgeVideos(item).length;
}
