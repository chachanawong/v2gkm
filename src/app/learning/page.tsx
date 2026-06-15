"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredUser, getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { Lesson, LearningPath } from "@/lib/types";

export default function LearningPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const { pathProgress } = useProgress(user?.id ?? "");

  useEffect(() => {
    fetch("/api/learning", { headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        setPaths(Array.isArray(d.paths) ? d.paths : []);
        setLessons(Array.isArray(d.lessons) ? d.lessons : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <p className="eyebrow">Learning</p>
          <h1>เส้นทางการเรียนรู้</h1>
        </div>
      </div>

      {loading ? <Skeleton rows={4} /> : null}

      <div className="sg-stack" style={{ gap: 20, marginTop: 8 }}>
        {paths.map((path) => {
          const pathLessons = lessons.filter((l) => l.pathId === path.id);
          const prog = pathProgress(path.id, pathLessons.length);
          return (
            <Link key={path.id} href={`/learning/${path.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article className="content-card" style={{ flexDirection: "row", display: "flex", alignItems: "stretch" }}>
                {path.thumbnail ? (
                  <div className="card-image" style={{ width: 160, flexShrink: 0, aspectRatio: "unset" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={path.thumbnail} alt={path.title} />
                  </div>
                ) : null}
                <div className="card-body" style={{ flex: 1 }}>
                  <h3>{path.title}</h3>
                  <div className="card-meta">
                    <Badge tone={path.visibility === "platinum" ? "dark" : path.visibility === "silver" ? "neutral" : "neutral"}>{path.visibility}</Badge>
                    <span>{pathLessons.length} บทเรียน</span>
                  </div>
                  <p className="line-clamp two-line" style={{ fontSize: 13, color: "var(--secondary)" }}>{path.description}</p>
                  <ProgressBar pct={prog.pct} done={prog.done} total={prog.total} />
                </div>
              </article>
            </Link>
          );
        })}
        {!loading && paths.length === 0 ? (
          <p style={{ color: "var(--secondary)", fontSize: 13 }}>ยังไม่มีเส้นทางการเรียนรู้ในขณะนี้</p>
        ) : null}
      </div>
    </AppShell>
  );
}

function ProgressBar({ pct, done, total }: { pct: number; done: number; total: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ height: 4, background: "var(--surface-container)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--secondary)" }}>
        {pct === 100 ? "เรียนจบแล้ว ✓" : `${done}/${total} บทเรียน · ${pct}%`}
      </span>
    </div>
  );
}
