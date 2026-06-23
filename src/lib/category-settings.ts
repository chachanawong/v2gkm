import type { Category, CategoryType } from "./types";

const DEFAULT_CATEGORY_TYPE_MAP: Record<string, CategoryType[]> = {
  business: ["knowledge", "news"],
  leadership: ["knowledge", "profiles"],
  training: ["knowledge", "news"],
  product: ["knowledge", "news"],
  products: ["knowledge", "news"],
  news: ["news"],
  community: ["news"],
  mindset: ["profiles"],
  rally: ["knowledge"],
};

const HIDDEN_CATEGORY_NAMES = new Set(["profile", "profiles"]);

export function normalizeCategoryType(value: unknown): CategoryType | "" {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "knowledge") return "knowledge";
  if (text === "news") return "news";
  if (text === "profiles" || text === "profile") return "profiles";
  return "";
}

export function normalizeCategoryTypes(value: unknown): CategoryType[] {
  if (Array.isArray(value)) {
    const seen = new Set<CategoryType>();
    return value
      .map((item) => normalizeCategoryType(item))
      .filter((item): item is CategoryType => {
        if (!item || seen.has(item)) return false;
        seen.add(item);
        return true;
      });
  }
  const single = normalizeCategoryType(value);
  return single ? [single] : [];
}

export function categoryTypeLabel(type: CategoryType) {
  if (type === "knowledge") return "Knowledge";
  if (type === "news") return "News";
  return "Profile";
}

export function isHiddenCategory(category: Pick<Category, "name">) {
  return HIDDEN_CATEGORY_NAMES.has(String(category.name ?? "").trim().toLowerCase());
}

export function resolveCategoryTypes(category: Pick<Category, "name" | "type"> & { types?: unknown }) {
  const explicitTypes = normalizeCategoryTypes(category.types);
  if (explicitTypes.length) return explicitTypes;

  const singleType = normalizeCategoryType(category.type);
  if (singleType) return [singleType];

  return DEFAULT_CATEGORY_TYPE_MAP[String(category.name ?? "").trim().toLowerCase()] ?? [];
}

export function isUnassignedCategory(category: Pick<Category, "name" | "type"> & { types?: unknown }) {
  if (isHiddenCategory(category)) return false;
  return resolveCategoryTypes(category).length === 0;
}

export function filterCategoriesByType(
  categories: Category[],
  type: CategoryType,
  options: { includeLegacy?: boolean; activeOnly?: boolean } = {},
) {
  const { includeLegacy = true, activeOnly = true } = options;
  return categories.filter((category) => {
    if (isHiddenCategory(category)) return false;
    if (activeOnly && category.active === false) return false;
    const categoryTypes = resolveCategoryTypes(category);
    if (categoryTypes.length) return categoryTypes.includes(type);
    return includeLegacy;
  });
}

export function sortCategoriesByName(categories: Category[]) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategoryOptionNames(
  categories: Category[],
  type: CategoryType,
  options: { includeLegacy?: boolean; activeOnly?: boolean } = {},
) {
  const seen = new Set<string>();
  return sortCategoriesByName(filterCategoriesByType(categories, type, options))
    .map((item) => item.name.trim())
    .filter((name) => {
      if (!name) return false;
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
