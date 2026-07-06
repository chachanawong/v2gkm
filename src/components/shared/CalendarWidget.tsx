"use client";

import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getUserToken, useStoredMembership } from "@/lib/client-session";
import type { Event } from "@/lib/types";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const EVENT_TYPE_COLOR: Record<string, string> = {
  seminar: "var(--info, #3b82f6)",
  training: "var(--success)",
  social: "#f59e0b",
  online: "var(--secondary)",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  seminar: "สัมมนา",
  training: "อบรม",
  social: "สังสรรค์",
  online: "ออนไลน์",
};

function isoToDateStr(iso: string) {
  return iso.slice(0, 10);
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CalendarWidget({ variant = "compact" }: { variant?: "compact" | "panel" }) {
  const isPanel = variant === "panel";
  const [open, setOpen] = useState(isPanel);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [events, setEvents] = useState<Event[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const membership = useStoredMembership();

  // Fetch events once on mount (and when membership changes)
  useEffect(() => {
    const token = getUserToken();
    fetch("/api/events", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.items)) setEvents(d.items as Event[]); })
      .catch(() => undefined);
  }, [membership]);

  // Close on outside click
  useEffect(() => {
    if (!open || isPanel) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isPanel, open]);

  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Group events by startDate (day string)
  const eventsByDate = new Map<string, Event[]>();
  events.forEach((ev) => {
    const ds = isoToDateStr(ev.startDate);
    const existing = eventsByDate.get(ds) ?? [];
    existing.push(ev);
    eventsByDate.set(ds, existing);
  });

  // Events in this calendar month
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const monthEvents = events
    .filter((ev) => isoToDateStr(ev.startDate).startsWith(monthStr))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Upcoming events count (badge on button)
  const upcomingCount = events.filter((ev) => new Date(ev.startDate) >= today).length;

  function dayStr(d: number) {
    return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return (
    <div className={isPanel ? "cal-widget cal-widget-panel" : "cal-widget"} ref={ref}>
      {!isPanel ? (
        <button
          type="button"
          className={open ? "cal-btn active" : "cal-btn"}
          onClick={() => setOpen((v) => !v)}
          aria-label="ปฏิทินกิจกรรม"
          style={{ position: "relative" }}
        >
          <CalendarDays size={18} />
          {upcomingCount > 0 ? (
            <span style={{
              position: "absolute", top: -4, right: -4,
              background: "var(--error)", color: "#fff",
              borderRadius: 10, fontSize: 8, fontWeight: 700,
              padding: "1px 4px", lineHeight: 1.5, pointerEvents: "none",
            }}>{upcomingCount}</span>
          ) : null}
        </button>
      ) : null}

      {open ? (
        <div className={isPanel ? "cal-popup cal-popup-panel" : "cal-popup"}>
          <div className="cal-header">
            <div className="cal-header-title">
              <span className="cal-header-kicker">Calendar</span>
              <span className="cal-month-label">{MONTHS_TH[monthIdx]} {year}</span>
            </div>
            <button type="button" className="cal-nav" onClick={() => setMonth(new Date(year, monthIdx - 1, 1))}>
              <ChevronLeft size={14} />
            </button>
            <button type="button" className="cal-nav" onClick={() => setMonth(new Date(year, monthIdx + 1, 1))}>
              <ChevronRight size={14} />
            </button>
            {!isPanel ? (
              <button type="button" className="cal-close" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="cal-grid">
            {DAYS_TH.map((d) => (
              <div className="cal-day-head" key={d}>{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const ds = dayStr(d);
              const isToday = ds === todayStr;
              const dayEvents = eventsByDate.get(ds) ?? [];
              const hasEvent = dayEvents.length > 0;
              // Pick first event type color for dot
              const dotColor = hasEvent ? (EVENT_TYPE_COLOR[dayEvents[0].eventType] ?? "var(--primary)") : undefined;
              return (
                <div
                  key={d}
                  className={["cal-day", isToday ? "today" : "", hasEvent ? "has-event" : ""].filter(Boolean).join(" ")}
                  title={hasEvent ? dayEvents.map((e) => e.title).join(", ") : undefined}
                >
                  {d}
                  {hasEvent ? <span className="cal-dot" style={dotColor ? { background: dotColor } : undefined} /> : null}
                </div>
              );
            })}
          </div>

          {monthEvents.length > 0 ? (
            <div className="cal-events">
              <div className="cal-events-head">
                <p className="cal-events-label">กิจกรรมในเดือนนี้</p>
                <span className="cal-upcoming-count">{upcomingCount} upcoming</span>
              </div>
              {monthEvents.map((ev) => (
                <div className="cal-event-row" key={ev.id}>
                  <span
                    className="cal-event-date"
                    style={{ color: EVENT_TYPE_COLOR[ev.eventType] ?? "var(--primary)" }}
                  >
                    {isoToDateStr(ev.startDate).slice(8)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="cal-event-title">{ev.title}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: EVENT_TYPE_COLOR[ev.eventType] ?? "var(--primary)", color: "#fff", letterSpacing: "0.04em" }}>
                        {EVENT_TYPE_LABEL[ev.eventType] ?? ev.eventType}
                      </span>
                      {ev.location ? (
                        <span style={{ fontSize: 9, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 2 }}>
                          <MapPin size={9} />{ev.location}
                        </span>
                      ) : null}
                      <span style={{ fontSize: 9, color: "var(--secondary)", marginLeft: "auto" }}>
                        {formatShortDate(ev.startDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cal-events">
              <div className="cal-events-head">
                <p className="cal-events-label">กิจกรรมในเดือนนี้</p>
                <span className="cal-upcoming-count">{upcomingCount} upcoming</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--secondary)", textAlign: "center", padding: "8px 0" }}>ไม่มีกิจกรรมในเดือนนี้</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
