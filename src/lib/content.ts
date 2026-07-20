import { cache } from "react";
import { batchListSheets, listSheet } from "./google-sheets";
import { applyPublishWindow } from "./publish";
import { visiblePublished } from "./visibility";
import type { Knowledge, Membership, News, Profile } from "./types";

export const getUserContent = cache(async (membership: Membership) => {
  const data = await batchListSheets(["knowledge", "news", "profiles", "categories"]);
  return {
    knowledge: visiblePublished((data.knowledge as Knowledge[]).map((item) => applyPublishWindow(item)), membership),
    news: visiblePublished((data.news as News[]).map((item) => applyPublishWindow(item)), membership),
    profiles: visiblePublished((data.profiles as Profile[]).map((item) => applyPublishWindow(item)), membership),
    categories: data.categories,
  };
});

export async function findContent(type: "knowledge" | "news" | "profiles", id: string) {
  const list = await listSheet(type);
  return list.find((item) => "id" in item && item.id === id) ?? null;
}
