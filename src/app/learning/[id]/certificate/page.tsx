"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Button } from "@/components/ui/Button";
import { getStoredUser, getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { LearningPath, Lesson } from "@/lib/types";

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const user = getStoredUser();
  const { pathProgress } = useProgress(user?.id ?? "");

  useEffect(() => {
    fetch("/api/learning", { headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const allPaths = Array.isArray(d.paths) ? (d.paths as LearningPath[]) : [];
        const allLessons = Array.isArray(d.lessons) ? (d.lessons as Lesson[]) : [];
        setPath(allPaths.find((p) => p.id === id) ?? null);
        setLessons(allLessons.filter((l) => l.pathId === id));
      });
  }, [id]);

  const prog = pathProgress(id, lessons.length);
  const completedAt = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  if (!user || !path) return (
    <AppShell>
      <p style={{ color: "var(--secondary)", padding: 32 }}>ไม่พบข้อมูล</p>
    </AppShell>
  );

  if (prog.pct < 100) return (
    <AppShell>
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <p style={{ color: "var(--secondary)" }}>คุณยังเรียนไม่จบ — ผ่านแล้ว {prog.done}/{prog.total} บทเรียน</p>
        <Link href={`/learning/${id}`}><Button variant="secondary">กลับไปเรียนต่อ</Button></Link>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Link href={`/learning/${id}`} className="muted-link">← กลับ</Link>
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => window.print()}>พิมพ์ใบรับรอง</button>
      </div>

      <div id="certificate" style={{
        maxWidth: 700,
        margin: "0 auto",
        border: "2px solid var(--outline-variant)",
        borderRadius: "var(--radius)",
        padding: "56px 64px",
        textAlign: "center",
        background: "var(--surface)",
        position: "relative",
      }}>
        <div style={{ marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/v2g-logo-circle.png" alt="V2G" style={{ width: 64, height: 64, borderRadius: 9999, objectFit: "cover" }} />
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--secondary)", textTransform: "uppercase", marginBottom: 8 }}>V2G Academy Learning Center</p>
        <p style={{ fontSize: 13, color: "var(--secondary)", marginBottom: 32 }}>ใบรับรองการเรียนจบหลักสูตร</p>

        <div style={{ borderTop: "1px solid var(--outline-variant)", borderBottom: "1px solid var(--outline-variant)", padding: "32px 0", marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: "var(--secondary)", marginBottom: 8 }}>มอบให้แก่</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{user.name}</h2>
          <p style={{ fontSize: 13, color: "var(--secondary)", marginBottom: 24 }}>สมาชิก · {user.membership}</p>
          <p style={{ fontSize: 13, color: "var(--secondary)", marginBottom: 8 }}>เพื่อรับรองว่าได้ศึกษาจนจบหลักสูตร</p>
          <h3 style={{ fontSize: 20, fontWeight: 600 }}>{path.title}</h3>
          <p style={{ fontSize: 13, color: "var(--secondary)", marginTop: 4 }}>{lessons.length} บทเรียน</p>
        </div>

        <p style={{ fontSize: 12, color: "var(--secondary)" }}>ออกใบรับรอง ณ วันที่ {completedAt}</p>
        <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 120, height: 1, background: "var(--outline)" }} />
            <span style={{ fontSize: 11, color: "var(--secondary)" }}>ผู้อำนวยการ</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 120, height: 1, background: "var(--outline)" }} />
            <span style={{ fontSize: 11, color: "var(--secondary)" }}>ผู้เข้าร่วม</span>
          </div>
        </div>
      </div>

      <style>{`@media print { .topbar, .muted-link, .btn { display: none !important; } #certificate { border: 2px solid #000 !important; max-width: 100% !important; } }`}</style>
    </AppShell>
  );
}
