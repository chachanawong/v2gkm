"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { getUserToken, useStoredUser } from "@/lib/client-session";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  const user = useStoredUser();

  useEffect(() => {
    if (user === null) {
      location.href = "/";
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const token = getUserToken();
    if (!token) {
      localStorage.removeItem("v2g_user");
      localStorage.removeItem("v2g_user_token");
      window.dispatchEvent(new Event("v2g-session"));
      return;
    }

    let active = true;
    fetch("/api/auth/user/session", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!active) return null;
        if (response.status === 401) {
          localStorage.removeItem("v2g_user");
          localStorage.removeItem("v2g_user_token");
          window.dispatchEvent(new Event("v2g-session"));
          return null;
        }
        if (!response.ok) return null;
        return response.json() as Promise<{ user?: unknown; token?: string }>;
      })
      .then((data) => {
        if (!active || !data?.user || !data.token) return;
        const nextUserRaw = JSON.stringify(data.user);
        const nextToken = data.token;
        if (localStorage.getItem("v2g_user") !== nextUserRaw || localStorage.getItem("v2g_user_token") !== nextToken) {
          localStorage.setItem("v2g_user", nextUserRaw);
          localStorage.setItem("v2g_user_token", nextToken);
          window.dispatchEvent(new Event("v2g-session"));
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return <div className="page-shell"><div className="loading-overlay">Loading...</div></div>;
  return (
    <div className="page-shell">
      <TopNav user={user} />
      <main className="content-wrap">{children}</main>
    </div>
  );
}
