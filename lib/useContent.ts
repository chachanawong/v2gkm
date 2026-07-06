"use client";

import { useEffect, useState } from "react";
import { getUserToken } from "./client-session";
import type { Category, Knowledge, Membership, News, Profile } from "./types";

type ContentBundle = {
  knowledge: Knowledge[];
  news: News[];
  profiles: Profile[];
  categories: Category[];
};

const cache = new Map<string, { items: unknown[]; expiresAt: number }>();
const bundleCache = new Map<string, { data: ContentBundle; expiresAt: number }>();
const ttl = 45_000;

export function useContent<T>(type: "knowledge" | "news" | "profiles" | "categories", membership?: Membership) {
  const key = `${type}:${membership}`;
  const cached = cache.get(key);
  const [items, setItems] = useState<T[]>(() => (cached ? (cached.items as T[]) : []));
  const [loading, setLoading] = useState(Boolean(membership) && !cached);

  useEffect(() => {
    let active = true;
    if (!membership) return;
    const current = cache.get(key);
    if (current && current.expiresAt > Date.now()) return;
    fetch(`/api/content/${type}`, {
      headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load content");
        return response;
      })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const nextItems = Array.isArray(data.items) ? data.items : [];
        cache.set(key, { items: nextItems, expiresAt: Date.now() + ttl });
        setItems((current) => (nextItems.length || current.length === 0 ? nextItems : current));
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [key, membership, type]);

  return { items, loading: !membership || loading };
}

const MIN_LOADING_MS = 600;

export function useContentBundle(membership?: Membership) {
  const key = `all:${membership}`;
  const cached = bundleCache.get(key);
  const [data, setData] = useState<ContentBundle | null>(() => cached?.data ?? null);
  const [loading, setLoading] = useState(Boolean(membership) && !cached);

  useEffect(() => {
    let active = true;
    if (!membership) return;
    const current = bundleCache.get(key);
    if (current && current.expiresAt > Date.now()) return;
    const startedAt = Date.now();
    setLoading(true);
    fetch("/api/content/all", {
      headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load content");
        return response.json();
      })
      .then((next: ContentBundle) => {
        if (!active) return;
        const safeNext: ContentBundle = {
          knowledge: Array.isArray(next.knowledge) ? next.knowledge : [],
          news: Array.isArray(next.news) ? next.news : [],
          profiles: Array.isArray(next.profiles) ? next.profiles : [],
          categories: Array.isArray(next.categories) ? next.categories : [],
        };
        bundleCache.set(key, { data: safeNext, expiresAt: Date.now() + ttl });
        (Object.keys(safeNext) as (keyof ContentBundle)[]).forEach((type) => {
          cache.set(`${type}:${membership}`, { items: safeNext[type], expiresAt: Date.now() + ttl });
        });
        setData((current) => (safeNext.knowledge.length || safeNext.news.length || safeNext.profiles.length || current === null ? safeNext : current));
        const remaining = MIN_LOADING_MS - (Date.now() - startedAt);
        const finish = () => active && setLoading(false);
        if (remaining > 0) setTimeout(finish, remaining); else finish();
      })
      .catch(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [key, membership]);

  return {
    data: data ?? { knowledge: [], news: [], profiles: [], categories: [] },
    loading: !membership || loading,
  };
}
