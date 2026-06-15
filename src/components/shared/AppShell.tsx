"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useStoredUser } from "@/lib/client-session";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  const user = useStoredUser();

  useEffect(() => {
    if (user === null) {
      location.href = "/";
    }
  }, [user]);

  if (!user) return <div className="page-shell"><div className="loading-overlay">Loading...</div></div>;
  return (
    <div className="page-shell">
      <TopNav user={user} />
      <main className="content-wrap">{children}</main>
    </div>
  );
}
