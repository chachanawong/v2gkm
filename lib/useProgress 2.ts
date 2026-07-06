"use client";

import { useCallback, useState } from "react";
import type { UserProgress } from "./types";

const KEY = "v2g_progress";

function loadProgress(): UserProgress[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as UserProgress[];
  } catch {
    return [];
  }
}

function saveProgress(rows: UserProgress[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function useProgress(userId: string) {
  const [rows, setRows] = useState<UserProgress[]>(() => loadProgress().filter((r) => r.userId === userId));

  const markComplete = useCallback(
    (lessonId: string, pathId: string, quizScore?: number) => {
      const id = `${userId}-${lessonId}`;
      const all = loadProgress();
      const existing = all.findIndex((r) => r.id === id);
      const record: UserProgress = {
        id,
        userId,
        lessonId,
        pathId,
        completed: true,
        quizScore,
        completedAt: new Date().toISOString(),
      };
      if (existing >= 0) all[existing] = record;
      else all.push(record);
      saveProgress(all);
      setRows(all.filter((r) => r.userId === userId));
    },
    [userId],
  );

  const isCompleted = useCallback(
    (lessonId: string) => rows.some((r) => r.lessonId === lessonId && r.completed),
    [rows],
  );

  const pathProgress = useCallback(
    (pathId: string, totalLessons: number) => {
      const done = rows.filter((r) => r.pathId === pathId && r.completed).length;
      return { done, total: totalLessons, pct: totalLessons ? Math.round((done / totalLessons) * 100) : 0 };
    },
    [rows],
  );

  return { rows, markComplete, isCompleted, pathProgress };
}
