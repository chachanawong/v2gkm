"use client";

import { useEffect, useState } from "react";
import { getBootstrapCache, setBootstrapCache } from "./bootstrap-cache";
import { getUserToken } from "./client-session";
import type { Category, Knowledge, Membership, News, Profile } from "./types";

export type ContentBundle = {
  knowledge: Knowledge[];
  news: News[];
  profiles: Profile[];
  categories: Category[];
};

const cache = new Map<string, { items: unknown[]; expiresAt: number }>();
const bundleCache = new Map<string, { data: ContentBundle; expiresAt: number }>();
const ttl = 300_000;

function useSessionToken() {
  const [token, setToken] = useState<string | null>(() => (typeof window === "undefined" ? null : getUserToken()));

  useEffect(() => {
    const sync = () => setToken(getUserToken());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("v2g-session", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("v2g-session", sync);
    };
  }, []);

  return token;
}

export function useContent<T>(type: "knowledge" | "news" | "profiles" | "categories", membership?: Membership) {
  const token = useSessionToken();
  const key = `${type}:${membership}:${token ?? "guest"}`;
  const cached = cache.get(key);
  const bootstrap = getBootstrapCache<T[]>(`user:${key}`);
  const [items, setItems] = useState<T[]>(() => (cached ? (cached.items as T[]) : (bootstrap ?? [])));
  const [loading, setLoading] = useState(Boolean(membership) && !cached);

  useEffect(() => {
    let active = true;
    if (!membership) return;
    const current = cache.get(key);
    if (current && current.expiresAt > Date.now()) return;
    if (bootstrap?.length) {
      cache.set(key, { items: bootstrap, expiresAt: Date.now() + ttl });
    }
    fetch(`/api/content/${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        setBootstrapCache(`user:${key}`, nextItems, ttl);
        setItems((current) => (nextItems.length || current.length === 0 ? nextItems : current));
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [bootstrap, key, membership, token, type]);

  return { items, loading: !membership || loading };
}

export function useContentBundle(membership?: Membership) {
  const token = useSessionToken();
  const key = `all:${membership}:${token ?? "guest"}`;
  const cached = bundleCache.get(key);
  const bootstrap = getBootstrapCache<ContentBundle>(`user:${key}`);
  const [data, setData] = useState<ContentBundle | null>(() => cached?.data ?? bootstrap ?? null);
  const [loading, setLoading] = useState(Boolean(membership) && !cached && !bootstrap);

  useEffect(() => {
    let active = true;
    if (!membership) return;
    const current = bundleCache.get(key);
    if (current && current.expiresAt > Date.now()) return;
    if (bootstrap) {
      bundleCache.set(key, { data: bootstrap, expiresAt: Date.now() + ttl });
    }
    fetch("/api/content/all", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        setBootstrapCache(`user:${key}`, safeNext, ttl);
        (Object.keys(safeNext) as (keyof ContentBundle)[]).forEach((type) => {
          cache.set(`${type}:${membership}:${token ?? "guest"}`, { items: safeNext[type], expiresAt: Date.now() + ttl });
          setBootstrapCache(`user:${type}:${membership}:${token ?? "guest"}`, safeNext[type], ttl);
        });
        setData((current) => (safeNext.knowledge.length || safeNext.news.length || safeNext.profiles.length || current === null ? safeNext : current));
        if (active) setLoading(false);
      })
      .catch(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [bootstrap, key, membership, token]);

  return {
    data: data ?? { knowledge: [], news: [], profiles: [], categories: [] },
    loading: !membership || loading,
  };
}
