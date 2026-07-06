"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getStoredAdmin, getAdminToken } from "@/lib/client-session";
import { requestGlobalConfirm, withGlobalLoading } from "@/lib/overlay";
import type { PinResetRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function PinResetRequestsPanel({ requests }: { requests: PinResetRequest[] }) {
  const [items, setItems] = useState(requests);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    let active = true;

    async function loadLatest() {
      try {
        const response = await fetch("/api/admin/pin-reset-requests", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({})) as { items?: PinResetRequest[]; error?: string };
        if (!active || !response.ok || !Array.isArray(data.items)) return;
        setItems(data.items);
      } catch {
        if (!active) return;
      }
    }

    void loadLatest();
    pollRef.current = setInterval(() => {
      void loadLatest();
    }, 10000);

    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function submit(id: string, action: "approve" | "reject") {
    const admin = getStoredAdmin();
    const token = getAdminToken();
    if (!token) {
      setError("Admin session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    const item = items.find((current) => current.id === id);
    const confirmed = await requestGlobalConfirm({
      title: action === "approve" ? "Confirm Approval" : "Confirm Rejection",
      message: `${action === "approve" ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}คำขอของ ${item?.userName || "สมาชิก"} ใช่หรือไม่?`,
      confirmText: action === "approve" ? "Approve" : "Reject",
      cancelText: "Cancel",
      tone: action === "approve" ? "default" : "danger",
    });
    if (!confirmed) return;

    setError("");
    setBusyId(id);
    try {
      const response = await withGlobalLoading(async () => fetch("/api/admin/pin-reset-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-name": admin?.name ?? "Admin",
        },
        body: JSON.stringify({ id, action }),
      }), action === "approve" ? "กำลังอนุมัติคำขอ" : "กำลังปฏิเสธคำขอ");

      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "อัปเดตคำขอไม่สำเร็จ");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-head">
        <div>
          <p className="eyebrow">NOTIFICATIONS</p>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>PIN RESET REQUESTS</h2>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="muted">ยังไม่มีคำขอรีเซ็ต PIN</p>
      ) : (
        <div className="pin-reset-list">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <div className="pin-reset-item" key={item.id}>
                <div>
                  <strong>{item.userName || "สมาชิก"}</strong>
                  <span>{item.phone}</span>
                  <time>{formatDateTime(item.requestedAt)}</time>
                </div>
                <div className="pin-reset-actions">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => submit(item.id, "reject")}
                    disabled={busy}
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => submit(item.id, "approve")}
                    disabled={busy}
                    icon={busy ? <Loader2 size={14} className="spin-icon" /> : undefined}
                  >
                    อนุมัติรีเซ็ต
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
