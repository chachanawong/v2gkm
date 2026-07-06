"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorageSet(key: string) {
  const [ids, setIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem(key) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(key, JSON.stringify([...next]));
        return next;
      });
    },
    [key],
  );

  const mark = useCallback(
    (id: string) => {
      setIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem(key, JSON.stringify([...next]));
        return next;
      });
    },
    [key],
  );

  return { ids, toggle, mark, has: (id: string) => ids.has(id) };
}

export function useLocalStorageList<T>(key: string, maxItems = 10) {
  const [items, setItems] = useState<T[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
    } catch {
      return [];
    }
  });

  const push = useCallback(
    (item: T & { id: string }) => {
      setItems((prev) => {
        const next = [item, ...prev.filter((p) => (p as { id: string }).id !== item.id)].slice(0, maxItems);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key, maxItems],
  );

  return { items, push };
}
