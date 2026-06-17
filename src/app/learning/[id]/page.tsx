"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredUser, getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { Lesson, LearningPath } from "@/lib/types";

export default function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const { isCompleted, pathProgress } = useProgress(user?.id ?? "");

  useEffect(() => {
    fetch("/api/learning", { headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const allPaths = Array.isArray(d.paths) ? (d.paths as LearningPath[]) : [];
        const allLessons = Array.isArray(d.lessons) ? (d.lessons as Lesson[]) : [];
        setPath(allPaths.find((p) => p.id === id) ?? null);
        setLessons(allLessons.filter((l) => l.pathId === id).sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!path) return;
    const token = getUserToken();
    if (!token || typeof window === "undefined") return;
    const key = `v2g-audit-open-path:${path.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    fetch("/api/learning/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "open_path", pathId: path.id }),
    }).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [path]);

  const prog = pathProgress(id, lessons.length);

  return (
    <AppShell>
      <div style={{ marginBottom: 8 }}>
        <Link href="/learning" className="muted-link">← กลับ</Link>
      </div>

      {loading ? <Skeleton rows={5} /> : null}

      {path ? (
        <>
          <div className="section-head">
            <div>
              <p className="eyebrow">Learning Path</p>
              <h1>{path.title}</h1>
            </div>
            {prog.pct === 100 ? (
              <Link href={`/learning/${id}/certificate`} className="btn btn-secondary btn-sm">ดูใบรับรอง</Link>
            ) : null}
          </div>
          <p style={{ color: "var(--secondary)", fontSize: 13, maxWidth: 640, marginBottom: 16 }}>{path.description}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
            <div style={{ height: 6, background: "var(--surface-container)", borderRadius: 3, overflow: "hidden", maxWidth: 400 }}>
              <div style={{ height: "100%", width: `${prog.pct}%`, background: "var(--primary)", borderRadius: 3, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--secondary)" }}>
              {prog.pct === 100 ? "เรียนจบแล้ว!" : `${prog.done}/${prog.total} บทเรียน · ${prog.pct}%`}
            </span>
          </div>

          <div className="admin-list" style={{ maxWidth: 640 }}>
            {lessons.map((lesson, index) => {
              const done = isCompleted(lesson.id);
              const prevDone = index === 0 || isCompleted(lessons[index - 1].id);
              const locked = !prevDone && !done;
              return (
                <div key={lesson.id}>
                  {locked ? (
                    <div className="admin-row" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong>บทที่ {lesson.order} · {lesson.title}</strong>
                        <span style={{ fontSize: 12, color: "var(--secondary)" }}>ล็อก — ต้องผ่านบทก่อนหน้าก่อน</span>
                      </div>
                      <Badge tone="neutral">🔒</Badge>
                    </div>
                  ) : (
                    <Link href={`/learning/${id}/lesson/${lesson.id}`} style={{ textDecoration: "none" }}>
                      <div className="admin-row" style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong>บทที่ {lesson.order} · {lesson.title}</strong>
                          <span style={{ fontSize: 12, color: "var(--secondary)" }}>{lesson.description}</span>
                        </div>
                        <Badge tone={done ? "green" : "blue"}>{done ? "จบแล้ว ✓" : "เรียน"}</Badge>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : !loading ? (
        <p style={{ color: "var(--secondary)" }}>ไม่พบเส้นทางการเรียนรู้นี้</p>
      ) : null}
    </AppShell>
  );
}
