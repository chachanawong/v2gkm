"use client";

import { setBootstrapCache } from "./bootstrap-cache";
import type { ContentBundle } from "./useContent";
import type { Event, LearningPath, Lesson, Membership } from "./types";

const ttl = 300_000;

type LearningBundle = {
  paths: LearningPath[];
  lessons: Lesson[];
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function warmUserBootstrap(token: string, membership: Membership) {
  const contentKey = `all:${membership}:${token}`;
  fetch("/api/content/all", { headers: authHeaders(token) })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: ContentBundle | null) => {
      if (!data) return;
      setBootstrapCache(`user:${contentKey}`, data, ttl);
      setBootstrapCache(`user:knowledge:${membership}:${token}`, data.knowledge, ttl);
      setBootstrapCache(`user:news:${membership}:${token}`, data.news, ttl);
      setBootstrapCache(`user:profiles:${membership}:${token}`, data.profiles, ttl);
      setBootstrapCache(`user:categories:${membership}:${token}`, data.categories, ttl);
    })
    .catch(() => undefined);

  fetch("/api/events", { headers: authHeaders(token) })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { items?: Event[] } | null) => {
      if (Array.isArray(data?.items)) {
        setBootstrapCache(`user:events:${token}`, data.items, ttl);
      }
    })
    .catch(() => undefined);

  fetch("/api/learning", { headers: authHeaders(token) })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: LearningBundle | null) => {
      if (!data) return;
      setBootstrapCache(`user:learning:${token}`, {
        paths: Array.isArray(data.paths) ? data.paths : [],
        lessons: Array.isArray(data.lessons) ? data.lessons : [],
      }, ttl);
    })
    .catch(() => undefined);
}
