import { batchListSheets, listSheet } from "./google-sheets";
import { applyPublishWindow } from "./publish";
import { visiblePublished } from "./visibility";
import type { Knowledge, Membership, News, Profile } from "./types";

export async function getUserContent(membership: Membership) {
  const data = await batchListSheets(["knowledge", "news", "profiles", "categories"]);
  const visibleCategories = data.categories.filter((item) => item.active !== false && item.level !== "secret");
  const secretCategoryNames = new Set(data.categories.filter((item) => item.level === "secret").map((item) => item.name));
  return {
    knowledge: stripSecretCategories(visiblePublished((data.knowledge as Knowledge[]).map((item) => applyPublishWindow(item)), membership), secretCategoryNames),
    news: stripSecretCategories(visiblePublished((data.news as News[]).map((item) => applyPublishWindow(item)), membership), secretCategoryNames),
    profiles: stripSecretCategories(visiblePublished((data.profiles as Profile[]).map((item) => applyPublishWindow(item)), membership), secretCategoryNames),
    categories: visibleCategories,
  };
}

export async function findContent(type: "knowledge" | "news" | "profiles", id: string) {
  const list = await listSheet(type);
  return list.find((item) => "id" in item && item.id === id) ?? null;
}

function stripSecretCategories<T extends { categories?: string[] }>(items: T[], secretCategoryNames: Set<string>) {
  if (!secretCategoryNames.size) return items;
  return items.map((item) => ({
    ...item,
    categories: item.categories?.filter((category) => !secretCategoryNames.has(category)),
  }));
}
