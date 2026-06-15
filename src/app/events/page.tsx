"use client";

import { Calendar, MapPin, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredUser, getUserToken } from "@/lib/client-session";
import { useLocalStorageSet } from "@/lib/useLocalStorage";
import type { Event } from "@/lib/types";

const EVENT_TYPE_LABEL: Record<string, string> = {
  seminar: "สัมมนา",
  training: "อบรม",
  social: "งานสังสรรค์",
  online: "ออนไลน์",
};

const EVENT_TYPE_TONE: Record<string, "neutral" | "blue" | "green" | "amber"> = {
  seminar: "blue",
  training: "green",
  social: "amber",
  online: "neutral",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(event: Event) {
  return new Date(event.startDate) > new Date();
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Event | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regMsg, setRegMsg] = useState("");
  const registered = useLocalStorageSet("v2g_reg_events");
  const user = getStoredUser();

  useEffect(() => {
    fetch("/api/events", { headers: getUserToken() ? { Authorization: `Bearer ${getUserToken()}` } : {} })
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d.items) ? d.items : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return events
      .filter((e) => filter === "all" || (filter === "upcoming" ? isUpcoming(e) : !isUpcoming(e)))
      .filter((e) => typeFilter === "all" || e.eventType === typeFilter);
  }, [events, filter, typeFilter]);

  const myEvents = useMemo(() => events.filter((e) => registered.has(e.id)), [events, registered]);

  async function handleRegister(event: Event) {
    if (!user) return;
    setRegistering(true);
    setRegMsg("");
    try {
      const isReg = registered.has(event.id);
      const res = await fetch("/api/events/register", {
        method: isReg ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getUserToken() ?? ""}` },
        body: JSON.stringify({ eventId: event.id }),
      });
      if (res.ok) {
        registered.toggle(event.id);
        setRegMsg(isReg ? "ยกเลิกการลงทะเบียนแล้ว" : "ลงทะเบียนสำเร็จ!");
      } else {
        const d = await res.json() as { error?: string };
        setRegMsg(d.error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      setRegMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setRegistering(false);
  }

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <p className="eyebrow">Events</p>
          <h1>กิจกรรม & อบรม</h1>
        </div>
      </div>

      {myEvents.length > 0 ? (
        <section className="sg-block">
          <div className="section-head slim"><h2>กิจกรรมของฉัน</h2></div>
          <div className="admin-list" style={{ maxWidth: 640 }}>
            {myEvents.map((e) => (
              <div className="admin-row" key={e.id} style={{ cursor: "pointer" }} onClick={() => setSelected(e)}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong>{e.title}</strong>
                  <span>{formatDate(e.startDate)}</span>
                </div>
                <Badge tone={isUpcoming(e) ? "blue" : "neutral"}>{isUpcoming(e) ? "กำลังจะมา" : "ผ่านไปแล้ว"}</Badge>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="toolbar" style={{ marginTop: 24 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="upcoming">กำลังจะมา</option>
          <option value="past">ผ่านไปแล้ว</option>
          <option value="all">ทั้งหมด</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">ทุกประเภท</option>
          {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <Skeleton rows={4} /> : null}

      <div className="knowledge-grid" style={{ marginTop: 16 }}>
        {filtered.map((e) => (
          <button className="card-button" type="button" key={e.id} onClick={() => { setSelected(e); setRegMsg(""); }}>
            <article className="content-card">
              {e.images[0] ? (
                <div className="card-image" style={{ aspectRatio: "16/9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.images[0]} alt={e.title} />
                  <div className="card-image-tags">
                    <span className="card-image-tag">{EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}</span>
                  </div>
                </div>
              ) : null}
              <div className="card-body">
                <h3>{e.title}</h3>
                <div className="card-meta">
                  <Badge tone={EVENT_TYPE_TONE[e.eventType] ?? "neutral"}>{EVENT_TYPE_LABEL[e.eventType] ?? e.eventType}</Badge>
                  {registered.has(e.id) ? <Badge tone="green">ลงทะเบียนแล้ว</Badge> : null}
                  {e.pinned ? <Badge tone="dark">Pinned</Badge> : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} />{formatDate(e.startDate)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={12} />{e.location}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={12} />{e.capacity} ที่นั่ง</span>
                </div>
              </div>
            </article>
          </button>
        ))}
        {!loading && filtered.length === 0 ? (
          <p style={{ color: "var(--secondary)", fontSize: 13 }}>ไม่มีกิจกรรมในขณะนี้</p>
        ) : null}
      </div>

      <Modal open={Boolean(selected)} title={selected?.title ?? "กิจกรรม"} onClose={() => { setSelected(null); setRegMsg(""); }}>
        {selected ? (
          <div className="knowledge-preview">
            {selected.images[0] ? (
              <div className="card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.images[0]} alt={selected.title} />
              </div>
            ) : null}
            <div className="card-meta">
              <Badge tone={EVENT_TYPE_TONE[selected.eventType] ?? "neutral"}>{EVENT_TYPE_LABEL[selected.eventType] ?? selected.eventType}</Badge>
              <Badge tone={isUpcoming(selected) ? "blue" : "neutral"}>{isUpcoming(selected) ? "กำลังจะมา" : "ผ่านไปแล้ว"}</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} />{formatDate(selected.startDate)} — {formatDate(selected.endDate)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} />{selected.location}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={13} />รองรับ {selected.capacity} ที่นั่ง</span>
            </div>
            <p className="multiline" style={{ fontSize: 13 }}>{selected.description}</p>
            {regMsg ? <p style={{ fontSize: 12, color: regMsg.includes("สำเร็จ") ? "var(--success)" : "var(--error)" }}>{regMsg}</p> : null}
            {user && isUpcoming(selected) ? (
              <Button
                variant={registered.has(selected.id) ? "danger" : "primary"}
                onClick={() => handleRegister(selected)}
                disabled={registering}
              >
                {registering ? "กำลังดำเนินการ..." : registered.has(selected.id) ? "ยกเลิกการลงทะเบียน" : "ลงทะเบียนเข้าร่วม"}
              </Button>
            ) : null}
            {!user ? <p style={{ fontSize: 12, color: "var(--secondary)" }}>กรุณาเข้าสู่ระบบเพื่อลงทะเบียน</p> : null}
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
