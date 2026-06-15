"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { maskPhone } from "@/lib/format";
import { canAccessResource } from "@/lib/permissions";
import { getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { AdminRole, LearningPath, Lesson, User } from "@/lib/types";
import { CalendarWidget } from "./CalendarWidget";

export function TopNav({ admin = false, user, role }: { admin?: boolean; user?: User | null; role?: AdminRole }) {
  function logout() {
    const isAdmin = admin;
    const adminToken = localStorage.getItem("v2g_admin_token");
    if (isAdmin) {
      fetch("/api/admin/audit-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken ?? ""}`,
        },
        body: JSON.stringify({ action: "logout", resource: "admin" }),
        keepalive: true,
      }).catch(() => undefined);
    }
    localStorage.removeItem(admin ? "v2g_admin" : "v2g_user");
    localStorage.removeItem(admin ? "v2g_admin_token" : "v2g_user_token");
    window.dispatchEvent(new Event("v2g-session"));
    location.href = admin ? "/admin/login" : "/";
  }

  return (
    <header className="topbar">
      <Link href={admin ? "/admin/dashboard" : "/home"} className="brand" aria-label="V2G KM">
        <Image src="/images/v2g-logo.jpg" alt="V2G" width={40} height={40} priority />
        {admin ? <span>ADMIN</span> : null}
      </Link>
      {!admin ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
          <CalendarWidget />
{user ? <MemberSummary user={user} /> : null}
          <button className="topbar-logout" type="button" onClick={logout}>Logout</button>
        </div>
      ) : null}
      {admin ? (
        <details className="admin-menu">
          <summary aria-label="Open admin menu">☰</summary>
          <AdminMenuContent role={role ?? "Content"} logout={logout} />
        </details>
      ) : null}
    </header>
  );
}

function MemberSummary({ user }: { user: User }) {
  const [hover, setHover] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const { pathProgress } = useProgress(user.id);

  useEffect(() => {
    const token = getUserToken();
    fetch("/api/learning", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.paths)) setPaths(d.paths as LearningPath[]);
        if (Array.isArray(d.lessons)) setLessons(d.lessons as Lesson[]);
      })
      .catch(() => undefined);
  }, []);

  const progressData = paths.map((p) => {
    const pathLessons = lessons.filter((l) => l.pathId === p.id);
    return { path: p, prog: pathProgress(p.id, pathLessons.length) };
  });

  const totalDone = progressData.reduce((s, x) => s + x.prog.done, 0);
  const totalLessons = progressData.reduce((s, x) => s + x.prog.total, 0);
  const overallPct = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <div
      ref={ref}
      className="member-summary"
      style={{ position: "relative", cursor: "default" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <TierPill tier={user.membership} />
        <i style={{ fontStyle: "normal", fontSize: 11, color: "var(--secondary)" }}>{maskPhone(user.phone)}</i>
      </div>

      {hover && paths.length > 0 ? (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "var(--surface)", border: "1px solid var(--outline-variant)",
          borderRadius: "var(--radius)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          padding: "12px 14px", minWidth: 220, zIndex: 200,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--secondary)", textTransform: "uppercase", marginBottom: 10 }}>
            ความก้าวหน้าการเรียน
          </p>

          {progressData.map(({ path, prog }) => (
            <div key={path.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <Link
                  href={`/learning/${path.id}`}
                  style={{ fontSize: 11, fontWeight: 600, color: "var(--on-background)", textDecoration: "none", lineHeight: 1.3 }}
                  onClick={() => setHover(false)}
                >
                  {path.title}
                </Link>
                <span style={{ fontSize: 10, color: prog.pct === 100 ? "var(--success)" : "var(--secondary)", fontWeight: 700, marginLeft: 8, whiteSpace: "nowrap" }}>
                  {prog.pct === 100 ? "✓ จบแล้ว" : `${prog.done}/${prog.total}`}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--surface-container)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${prog.pct}%`,
                  background: prog.pct === 100 ? "var(--success)" : "var(--primary)",
                  borderRadius: 2,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid var(--outline-variant)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--secondary)" }}>รวมทั้งหมด</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: overallPct === 100 ? "var(--success)" : "var(--primary)" }}>{overallPct}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  platinum: { bg: "#1a1a1a", color: "#e8d5a3" },
  silver:   { bg: "#6b7280", color: "#fff" },
  general:  { bg: "var(--surface-container)", color: "var(--secondary)" },
};

function TierPill({ tier }: { tier: string }) {
  const s = TIER_STYLE[tier] ?? TIER_STYLE.general;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color,
      borderRadius: 4, padding: "2px 8px",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {tier}
    </span>
  );
}

function AdminMenuContent({ role, logout }: { role: AdminRole; logout: () => void }) {
  const isAdmin = role === "Admin";
  const canContent = canAccessResource(role, "knowledge") || canAccessResource(role, "news") || canAccessResource(role, "profiles") || canAccessResource(role, "categories");
  const canEvents = canAccessResource(role, "events");
  const canLearning = canAccessResource(role, "learning_paths");
  const canAccount = canAccessResource(role, "users") || canAccessResource(role, "account");
  return (
    <nav className="nav admin-nav" aria-label="Admin navigation">
      {isAdmin ? <Link href="/admin/dashboard">Analytics</Link> : null}
      {canContent ? (
        <div className="nav-group">
          <span>Content Management</span>
          {canAccessResource(role, "knowledge") ? <Link href="/admin/knowledge">Knowledge</Link> : null}
          {canAccessResource(role, "news") ? <Link href="/admin/news">News</Link> : null}
          {canAccessResource(role, "profiles") ? <Link href="/admin/profiles">Profiles</Link> : null}
          {canAccessResource(role, "categories") ? <Link href="/admin/categories">Categories</Link> : null}
        </div>
      ) : null}
      {canEvents || canLearning ? (
        <div className="nav-group">
          <span>Programs</span>
          {canEvents ? <Link href="/admin/events">Events</Link> : null}
          {canLearning ? <Link href="/admin/learning">Learning</Link> : null}
        </div>
      ) : null}
      {canAccount ? (
        <div className="nav-group">
          <span>User Management</span>
          {canAccessResource(role, "users") ? <Link href="/admin/users">Users</Link> : null}
          {canAccessResource(role, "admins") ? <Link href="/admin/staff">Staff</Link> : null}
          {isAdmin ? <Link href="/admin/permissions">Permissions</Link> : null}
        </div>
      ) : null}
      {canAccount ? <a href="https://v2gcenter.up.railway.app" target="_blank" rel="noreferrer">Account System</a> : null}
      {isAdmin ? <Link href="/styleguide" target="_blank" rel="noreferrer">Styleguide</Link> : null}
      <Link href="/home">User Home</Link>
      <button type="button" onClick={logout}>Logout</button>
    </nav>
  );
}
