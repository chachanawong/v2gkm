"use client";

import Image from "next/image";
import Link from "next/link";
import { maskPhone } from "@/lib/format";
import { canAccessResource } from "@/lib/permissions";
import type { AdminRole, User } from "@/lib/types";

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
      {!admin && user ? <MemberSummary user={user} /> : null}
      {!admin ? <button className="topbar-logout" type="button" onClick={logout}>Logout</button> : null}
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
  return (
    <div className="member-summary">
      <strong>{user.name}</strong>
      <span><b>{user.membership}</b><i>{maskPhone(user.phone)}</i></span>
      {user.uplinePlatinum ? <small>Upline: {user.uplinePlatinum}</small> : null}
    </div>
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
          {canAccessResource(role, "categories") ? <Link href="/admin/categories">Categories</Link> : null}
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
