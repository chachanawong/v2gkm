"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { getAdminToken } from "@/lib/client-session";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const EVENT_TYPE_LABEL: Record<string, string> = {
  seminar: "สัมมนา",
  training: "อบรม",
  social: "พบปะสังสรรค์",
  online: "ออนไลน์",
};

function buildMessage(event: Event): string {
  const lines: string[] = [];
  lines.push(`📢 ${event.title}`);
  lines.push("");
  if (event.startDate) {
    const start = new Date(event.startDate).toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    lines.push(`🗓 วันที่: ${start}`);
  }
  if (event.location) lines.push(`📍 สถานที่: ${event.location}`);
  if (event.capacity) lines.push(`👥 รองรับ: ${event.capacity} คน`);
  if (event.eventType) lines.push(`🎯 ประเภท: ${EVENT_TYPE_LABEL[event.eventType] ?? event.eventType}`);
  if (event.description) {
    lines.push("");
    lines.push(event.description.slice(0, 300) + (event.description.length > 300 ? "..." : ""));
  }
  lines.push("");
  lines.push("📌 ดูรายละเอียดและลงทะเบียนได้ที่เว็บไซต์ V2G KM");
  return lines.join("\n");
}

export function LineBroadcastPanel({ events, hasToken = false }: { events: Event[]; hasToken?: boolean }) {
  const [active, setActive] = useState<Event | null>(null);
  const [message, setMessage] = useState("");
  const [groupId, setGroupId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function openBroadcast(event: Event) {
    setActive(event);
    setMessage(buildMessage(event));
    setGroupId("");
    setResult(null);
  }

  async function send() {
    if (!active || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast-line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ message, groupId: groupId || undefined }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok) {
        setResult({ ok: true, message: "ส่งสำเร็จ!" });
      } else {
        setResult({ ok: false, message: data.error ?? "เกิดข้อผิดพลาด" });
      }
    } catch {
      setResult({ ok: false, message: "ไม่สามารถเชื่อมต่อได้" });
    } finally {
      setSending(false);
    }
  }

  const published = events.filter((e) => e.status === "published");

  if (!published.length) return null;

  return (
    <section className="admin-section" style={{ marginTop: 32 }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">Line</p>
          <h1>Broadcast Events</h1>
        </div>
      </div>
      <div className="list-panel">
        <h2>เลือก Event ที่ต้องการส่งเข้ากลุ่ม Line</h2>
        <div className="admin-list">
          {published.map((event) => (
            <div className="admin-row" key={event.id}>
              <div className="row-summary">
                <strong>{event.title}</strong>
                <span style={{ fontSize: 12, color: "var(--secondary)" }}>
                  {event.startDate ? new Date(event.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="green">Published</Badge>
                <Button
                  size="sm"
                  icon={<Send size={13} />}
                  onClick={() => openBroadcast(event)}
                >
                  Broadcast
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(active)}
        title={`Broadcast: ${active?.title ?? ""}`}
        onClose={() => setActive(null)}
        footer={
          result?.ok ? (
            <Button size="sm" onClick={() => setActive(null)}>ปิด</Button>
          ) : (
            <Button size="sm" icon={<Send size={14} />} onClick={send} disabled={sending}>
              {sending ? "กำลังส่ง..." : "ส่งเข้ากลุ่ม Line"}
            </Button>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label className="field">
            <span>
              Line Group ID{" "}
              <span style={{ fontWeight: 400, color: "var(--secondary)", fontSize: 11 }}>
                (ถ้าไม่กรอก ใช้ค่า LINE_GROUP_ID ใน env)
              </span>
            </span>
            <input
              type="text"
              placeholder="C1234567890abcdef..."
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
          </label>

          <label className="field">
            <span>ข้อความ</span>
            <textarea
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ fontFamily: "inherit", fontSize: 13, lineHeight: 1.6 }}
            />
          </label>

          <p style={{ fontSize: 11, color: "var(--secondary)" }}>
            ตัวอักษร {message.length} / 5000
          </p>

          {result ? (
            <p style={{ fontWeight: 600, color: result.ok ? "var(--success)" : "var(--error)", fontSize: 13 }}>
              {result.ok ? "✓ " : "✕ "}{result.message}
            </p>
          ) : null}

          {!hasToken && (
            <div style={{ background: "var(--surface-container)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12, color: "var(--secondary)" }}>
              <strong style={{ display: "block", marginBottom: 4 }}>Setup ที่ต้องทำ (ใน .env.local):</strong>
              <code style={{ display: "block" }}>LINE_CHANNEL_ACCESS_TOKEN=&lt;token จาก LINE Developers&gt;</code>
              <code style={{ display: "block" }}>LINE_GROUP_ID=&lt;C... group ID&gt;</code>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
