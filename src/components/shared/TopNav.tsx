"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBootstrapCache, setBootstrapCache } from "@/lib/bootstrap-cache";
import { maskPhone } from "@/lib/format";
import { requestGlobalConfirm, showGlobalLoading } from "@/lib/overlay";
import { canAccessResource } from "@/lib/permissions";
import { clearAdminSession, clearUserSession, getUserToken } from "@/lib/client-session";
import { useProgress } from "@/lib/useProgress";
import type { AdminRole, LearningPath, Lesson, User } from "@/lib/types";

export function TopNav({ admin = false, user, role }: { admin?: boolean; user?: User | null; role?: AdminRole }) {
  async function logout() {
    const confirmed = await requestGlobalConfirm({
      title: "Confirm Logout",
      message: `ต้องการออกจากระบบ${admin ? "ผู้ดูแล" : ""}ใช่หรือไม่?`,
      confirmText: "Logout",
      cancelText: "Stay",
      tone: "danger",
    });
    if (!confirmed) return;

    showGlobalLoading("กำลังออกจากระบบ");
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
    if (admin) clearAdminSession();
    else clearUserSession();
    location.href = admin ? "/admin/login" : "/";
  }

  return (
    <header className="topbar">
      <Link href={admin ? "/admin/dashboard" : "/home"} className="brand" aria-label={admin ? "V2G ADMIN" : "V2G LEARNING CENTER"}>
        <Image src="/images/v2g-logo-circle.png" alt={admin ? "V2G ADMIN" : "V2G LEARNING CENTER"} width={40} height={40} priority />
        <span>{admin ? "ADMIN" : "V2G LEARNING CENTER"}</span>
      </Link>
      {!admin ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
          {user ? <MembershipExpiryBadge /> : null}
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

function MembershipExpiryBadge() {
  const token = getUserToken();
  const cached = getBootstrapCache<{
    daysRemaining: number | null;
    latestPaymentDate?: string | null;
  }>(`user:membership-status:${token ?? "guest"}`);
  const [state, setState] = useState<{
    loading: boolean;
    daysRemaining: number | null;
    latestPaymentDate?: string | null;
  }>(() => ({
    loading: Boolean(token) && !cached,
    daysRemaining: cached?.daysRemaining ?? null,
    latestPaymentDate: cached?.latestPaymentDate ?? null,
  }));

  useEffect(() => {
    if (!token) return;
    if (cached) return;

    let active = true;
    const browserWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const load = () => {
      fetch("/api/user/membership-status", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.ok ? response.json() : null)
        .then((data: { daysRemaining?: number | null; latestPaymentDate?: string | null } | null) => {
          if (!active) return;
          const next = {
            loading: false,
            daysRemaining: typeof data?.daysRemaining === "number" ? data.daysRemaining : null,
            latestPaymentDate: data?.latestPaymentDate ?? null,
          };
          setBootstrapCache(`user:membership-status:${token ?? "guest"}`, {
            daysRemaining: next.daysRemaining,
            latestPaymentDate: next.latestPaymentDate,
          }, 300_000);
          setState(next);
        })
        .catch(() => {
          if (active) {
            setState({ loading: false, daysRemaining: null, latestPaymentDate: null });
          }
        });
    };

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof window.setTimeout> | null = null;

    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(load, { timeout: 2000 });
    } else {
      timeoutId = globalThis.setTimeout(load, 600);
    }

    return () => {
      active = false;
      if (browserWindow.cancelIdleCallback && idleId !== null) {
        browserWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [cached, token]);

  if (state.loading) {
    return <span className="membership-expiry-badge">กำลังเช็กสมาชิก</span>;
  }

  if (state.daysRemaining === null) {
    return (
      <span
        className="membership-expiry-badge"
        title={state.latestPaymentDate ? `Payment ล่าสุด ${state.latestPaymentDate}` : "ไม่พบ Payment Date"}
      >
        สมาชิก
      </span>
    );
  }

  const toneClass = state.daysRemaining < 7 ? "is-critical" : state.daysRemaining <= 10 ? "is-warning" : "";
  const label = state.daysRemaining < 0 ? `หมดอายุ ${Math.abs(state.daysRemaining)} วัน` : `เหลือ ${state.daysRemaining} วัน`;

  return (
    <span
      className={`membership-expiry-badge ${toneClass}`.trim()}
      title={state.latestPaymentDate ? `Payment ล่าสุด ${state.latestPaymentDate}` : undefined}
    >
      {label}
    </span>
  );
}

function MemberSummary({ user }: { user: User }) {
  const token = getUserToken();
  const cached = getBootstrapCache<{ paths: LearningPath[]; lessons: Lesson[] }>(`user:learning:${token ?? "guest"}`);
  const [hover, setHover] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>(() => cached?.paths ?? []);
  const [lessons, setLessons] = useState<Lesson[]>(() => cached?.lessons ?? []);
  const ref = useRef<HTMLDivElement>(null);
  const { pathProgress } = useProgress(user.id);

  useEffect(() => {
    if (!hover && cached) return;
    if (!hover && paths.length > 0) return;
    fetch("/api/learning", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => {
        const nextPaths = Array.isArray(d.paths) ? d.paths as LearningPath[] : [];
        const nextLessons = Array.isArray(d.lessons) ? d.lessons as Lesson[] : [];
        setPaths(nextPaths);
        setLessons(nextLessons);
        setBootstrapCache(`user:learning:${token ?? "guest"}`, { paths: nextPaths, lessons: nextLessons }, 300_000);
      })
      .catch(() => undefined);
  }, [cached, hover, paths.length, token]);

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
          {canAccessResource(role, "categories") ? <Link href="/admin/master-settings">Master Settings</Link> : null}
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
      <Link href="/home">User Home</Link>
      <button type="button" onClick={logout}>Logout</button>
    </nav>
  );
}
