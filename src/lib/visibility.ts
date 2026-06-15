import type { ContentItem, Membership } from "./types";
import { computeContentStatus } from "./publish";

const rank: Record<Membership, number> = {
  general: 1,
  silver: 2,
  platinum: 3,
};

export function canAccess(userLevel: Membership, contentLevel: Membership) {
  return rank[userLevel] >= rank[contentLevel];
}

export function filterVisible<T extends { visibility: Membership }>(items: T[], membership: Membership) {
  return items.filter((item) => canAccess(membership, item.visibility));
}

export function normalizeMembership(value?: string): Membership {
  if (value === "silver" || value === "platinum") return value;
  return "general";
}

export function isPlatinumUser(user?: { membership?: Membership } | null) {
  return user?.membership === "platinum";
}

export function visiblePublished<T extends ContentItem>(items: T[], membership: Membership, now = new Date()) {
  return filterVisible(items, membership).filter((item) => computeContentStatus({ status: item.status, publishTime: item.publishTime, publishUntil: item.publishUntil, now }) === "published");
}
