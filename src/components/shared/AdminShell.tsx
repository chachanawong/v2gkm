"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { isAdminRole, useStoredAdmin } from "@/lib/client-session";
import type { AdminRole } from "@/lib/types";
import { TopNav } from "./TopNav";

export function AdminShell({ children, allowed }: { children: ReactNode; allowed?: AdminRole[] }) {
  const admin = useStoredAdmin();
  const role = isAdminRole(admin?.role) ? admin.role : "Content";
  const denied = Boolean(admin && allowed?.length && !allowed.includes(role));

  useEffect(() => {
    if (admin === null) {
      location.href = "/admin/login";
    }
    if (denied) {
      location.href = role === "Account" ? "/admin/users" : role === "Content" ? "/admin/knowledge" : "/admin/dashboard";
    }
  }, [admin, denied, role]);

  if (!admin) return <div className="page-shell"><div className="loading-overlay">Loading...</div></div>;
  if (denied) return <div className="page-shell"><TopNav admin role={role} /><main className="content-wrap compact"><p className="form-error">Permission denied</p></main></div>;
  return (
    <div className="page-shell admin-shell">
      <TopNav admin role={role} />
      <main className="content-wrap compact">{children}</main>
    </div>
  );
}
