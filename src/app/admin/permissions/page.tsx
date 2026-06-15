"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/shared/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { permissionActions, rolePermissions } from "@/lib/permissions";
import type { AdminRole } from "@/lib/types";

const roles: AdminRole[] = ["Admin", "Content", "Account"];
const storageKey = "v2g_role_permissions";

export default function AdminPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Admin");
  const [permissions, setPermissions] = useState<Record<AdminRole, string[]>>(rolePermissions);
  const [saved, setSaved] = useState(false);
  const selected = useMemo(() => new Set(permissions[selectedRole]), [permissions, selectedRole]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      setPermissions({ ...rolePermissions, ...(JSON.parse(raw) as Record<AdminRole, string[]>) });
    } catch {
      setPermissions(rolePermissions);
    }
  }, []);

  function toggle(action: string) {
    setSaved(false);
    setPermissions((current) => {
      const currentRole = new Set(current[selectedRole]);
      if (currentRole.has(action)) currentRole.delete(action);
      else currentRole.add(action);
      return { ...current, [selectedRole]: permissionActions.filter((item) => currentRole.has(item)) };
    });
  }

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(permissions));
    setSaved(true);
  }

  return (
    <AdminShell allowed={["Admin"]}>
      <section className="admin-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">User Management</p>
            <h1>Permissions</h1>
          </div>
          <Button size="sm" onClick={save}>Save</Button>
        </div>
        <div className="permission-panel panel">
          <div className="role-selector" aria-label="Select role">
            {roles.map((role) => (
              <button className={role === selectedRole ? "is-active" : ""} type="button" onClick={() => setSelectedRole(role)} key={role}>
                {role}
              </button>
            ))}
          </div>
          <div className="permission-title">
            <Badge tone="dark">{selectedRole}</Badge>
            {saved ? <span className="muted">Saved</span> : <span className="muted">Select permissions</span>}
          </div>
          <div className="permission-list">
            {permissionActions.map((action) => (
              <label className="permission-item" key={action}>
                <span>{action}</span>
                <input type="checkbox" checked={selected.has(action)} onChange={() => toggle(action)} />
              </label>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
