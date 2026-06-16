"use client";

import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getStoredMembership, useStoredMembership } from "@/lib/client-session";
import { useLocalStorageList, useLocalStorageSet } from "@/lib/useLocalStorage";
import { getPrimaryImage, normalizeCategories } from "@/lib/normalize";
import { useContent } from "@/lib/useContent";
import { canAccess } from "@/lib/visibility";
import type { Category, Knowledge } from "@/lib/types";

export default function KnowledgePage() {
  const membership = useStoredMembership();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Knowledge | null>(null);
  const [tab, setTab] = useState<"all" | "bookmarks" | "recent">("all");
  const bookmarks = useLocalStorageSet("v2g_knowledge_bookmarks");
  const recent = useLocalStorageList<Knowledge & { id: string }>("v2g_knowledge_recent", 10);
  const { items, loading } = useContent<Knowledge>("knowledge", membership);
  const { items: categories } = useContent<Category>("categories", membership);

  const filtered = useMemo(() => {
    let base = [...items];
    if (tab === "bookmarks") base = base.filter((i) => bookmarks.has(i.id));
    if (tab === "recent") {
      const recentIds = recent.items.map((r) => r.id);
      base = recentIds.map((rid) => base.find((i) => i.id === rid)).filter(Boolean) as Knowledge[];
    }
    return base
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => category === "all" || normalizeCategories(item.categories).includes(category))
      .sort((a, b) => tab === "recent" ? 0 : sort === "views" ? b.viewCount - a.viewCount : b.uploadDate.localeCompare(a.uploadDate));
  }, [items, tab, bookmarks, recent.items, query, category, sort]);

  function openItem(item: Knowledge) {
    recent.push(item);
    setSelected(item);
  }

  const userMembership = membership ?? getStoredMembership();

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <p className="eyebrow">Knowledge</p>
          <h1>Learning Library</h1>
        </div>
      </div>

      <div className="toolbar">
        <div style={{ display: "flex", gap: 0, border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          {(["all", "bookmarks", "recent"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", background: tab === t ? "var(--primary)" : "var(--surface)", color: tab === t ? "var(--on-primary)" : "var(--secondary)", border: 0, cursor: "pointer", textTransform: "uppercase" }}>
              {t === "all" ? "ทั้งหมด" : t === "bookmarks" ? `บุ๊กมาร์ก (${bookmarks.ids.size})` : "อ่านล่าสุด"}
            </button>
          ))}
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา..." />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">ทุกหมวด</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        {tab !== "recent" ? (
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">ล่าสุด</option>
            <option value="views">ยอดนิยม</option>
          </select>
        ) : null}
      </div>

      {loading ? <Skeleton rows={5} /> : null}

      <div className="knowledge-grid">
        {filtered.map((item) => {
          const locked = !canAccess(userMembership, item.visibility);
          const isBookmarked = bookmarks.has(item.id);
          return (
            <div key={item.id} style={{ position: "relative" }}>
              <button className="card-button" type="button" onClick={() => locked ? undefined : openItem(item)} style={{ width: "100%", cursor: locked ? "default" : "pointer" }}>
                <ContentCard
                  title={item.title}
                  image={getPrimaryImage(item)}
                  meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span><span>{item.viewCount.toLocaleString()} views</span></>}
                >
                  <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  {locked ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                      <Badge tone="neutral">🔒 เฉพาะ {item.visibility}</Badge>
                      <span style={{ fontSize: 11, color: "var(--secondary)" }}>อัปเกรดสมาชิกเพื่อดูเนื้อหานี้</span>
                    </div>
                  ) : (
                    <span className="muted-link">ดูรายละเอียด</span>
                  )}
                </ContentCard>
              </button>
              {!locked ? (
                <button
                  type="button"
                  onClick={() => bookmarks.toggle(item.id)}
                  aria-label={isBookmarked ? "ลบบุ๊กมาร์ก" : "บุ๊กมาร์ก"}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: "1px solid var(--outline-variant)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
              ) : null}
            </div>
          );
        })}
        {!loading && filtered.length === 0 ? (
          <p style={{ color: "var(--secondary)", fontSize: 13 }}>ไม่มีเนื้อหาที่ตรงกับเงื่อนไข</p>
        ) : null}
      </div>

      <Modal open={Boolean(selected)} title={selected?.title ?? "Knowledge"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="knowledge-preview">
            <VideoEmbed youtubeId={selected.youtubeId} youtubeUrl={selected.youtubeUrl} title={selected.title} onView={() => trackView(selected.id)} />
            <div className="card-meta"><VisibilityBadge value={selected.visibility} /><span>{selected.uploadDate}</span><span>{selected.viewCount.toLocaleString()} views</span></div>
            <div className="tag-row">{normalizeCategories(selected.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <a href={selected.youtubeUrl || `https://www.youtube.com/watch?v=${selected.youtubeId}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>เปิด YouTube</Button>
              </a>
              <Button size="sm" variant="ghost" onClick={() => bookmarks.toggle(selected.id)}>
                {bookmarks.has(selected.id) ? "ลบบุ๊กมาร์ก" : "บุ๊กมาร์ก"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}

function trackView(id: string) {
  fetch(`/api/knowledge/${encodeURIComponent(id)}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
}

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? "";
}

function VideoEmbed({ youtubeId, youtubeUrl, title, onView }: { youtubeId: string; youtubeUrl: string; title: string; onView: () => void }) {
  const vid = youtubeId || extractYoutubeId(youtubeUrl);
  if (!vid) {
    return (
      <div style={{ background: "var(--surface-container)", borderRadius: "var(--radius)", padding: "32px 16px", textAlign: "center", color: "var(--secondary)", fontSize: 13, marginBottom: 12 }}>
        ไม่มีลิ้งค์วิดีโอ
      </div>
    );
  }
  return (
    <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 12 }} onClick={onView}>
      <iframe
        src={`https://www.youtube.com/embed/${vid}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}
