"use client";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function storageKey(key: string) {
  return `v2g:bootstrap:${key}`;
}

export function getBootstrapCache<T>(key: string): T | null {
  const current = memoryCache.get(key);
  if (current && current.expiresAt > Date.now()) {
    return current.data as T;
  }

  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(storageKey(key));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(storageKey(key));
      return null;
    }
    memoryCache.set(key, parsed as CacheEntry<unknown>);
    return parsed.data;
  } catch {
    window.sessionStorage.removeItem(storageKey(key));
    return null;
  }
}

export function setBootstrapCache<T>(key: string, data: T, ttlMs: number) {
  const entry: CacheEntry<T> = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
  memoryCache.set(key, entry as CacheEntry<unknown>);
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  }
}

export function clearBootstrapCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  }

  if (typeof window === "undefined") return;

  const keysToDelete: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (!key?.startsWith("v2g:bootstrap:")) continue;
    if (!prefix || key.startsWith(storageKey(prefix))) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => window.sessionStorage.removeItem(key));
}
