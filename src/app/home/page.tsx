"use client";

import { ExternalLink, LayoutGrid, LayoutList } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { HighlightBanner } from "@/components/shared/HighlightBanner";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useStoredMembership } from "@/lib/client-session";
import { getPrimaryImage, normalizeCategories, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import { toThaiCategory } from "@/lib/categoryTh";
import { useContentBundle } from "@/lib/useContent";
import { useLocalStorageSet } from "@/lib/useLocalStorage";
import type { Knowledge, News, Profile } from "@/lib/types";

const NEW_BADGE_DAYS = 7;
function isNew(news: News) {
  const published = news.publishTime ?? news.createdAt;
  if (!published) return false;
  return (Date.now() - new Date(published).getTime()) < NEW_BADGE_DAYS * 86_400_000;
}

type SelectedItem =
  | { type: "news"; item: News }
  | { type: "knowledge"; item: Knowledge }
  | { type: "profile"; item: Profile };

type ListModal = "news" | "knowledge" | "profiles";
type ActiveTab = "news" | "knowledge" | "profiles";

const TAB_DEFS: { tab: ActiveTab; label: string; eyebrow: string }[] = [
  { tab: "news",      label: "ข่าวสาร",        eyebrow: "News" },
  { tab: "knowledge", label: "ลิ้งค์เรียนรู้",  eyebrow: "Learning" },
  { tab: "profiles",  label: "ประวัติคนสำเร็จ", eyebrow: "People" },
];

export default function HomePage() {
  const membership = useStoredMembership();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("news");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [listModal, setListModal] = useState<ListModal | null>(null);
  const { data, loading } = useContentBundle(membership);
  const readNews = useLocalStorageSet("v2g_read_news");
  const [initializing, setInitializing] = useState(true);
  const initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    initTimer.current = setTimeout(() => setInitializing(false), 400);
    return () => { if (initTimer.current) clearTimeout(initTimer.current); };
  }, []);

  const showOverlay = initializing || loading;
  const normalizedQuery = query.trim().toLowerCase();

  const news = useMemo(() => {
    return [...data.news]
      .filter((item) => `${item.title} ${item.body} ${normalizeCategories(item.categories).join(" ")}`.toLowerCase().includes(normalizedQuery))
      .filter((item) => category === "all" || normalizeCategories(item.categories).includes(category))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [category, data.news, normalizedQuery]);

  const knowledge = useMemo(() => {
    return [...data.knowledge]
      .filter((item) => `${item.title} ${normalizeCategories(item.categories).join(" ")}`.toLowerCase().includes(normalizedQuery))
      .filter((item) => category === "all" || normalizeCategories(item.categories).includes(category))
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [category, data.knowledge, normalizedQuery]);

  const profiles = useMemo(() => {
    return [...data.profiles]
      .filter((item) => `${item.name} ${item.bio} ${item.position}`.toLowerCase().includes(normalizedQuery));
  }, [data.profiles, normalizedQuery]);

  const highlights = useMemo(() => {
    return [...data.news]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        image: getPrimaryImage(item),
        eyebrow: "Highlight",
        onClick: () => setSelected({ type: "news" as const, item }),
      }));
  }, [data.news]);

  const unreadCount = useMemo(() => news.filter((n) => !readNews.has(n.id)).length, [news, readNews]);
  const tabCounts = { news: news.length, knowledge: knowledge.length, profiles: profiles.length };
  const tabImages = useMemo(() => ({
    news:      getPrimaryImage(data.news[0]),
    knowledge: getPrimaryImage(data.knowledge[0]),
    profiles:  getPrimaryImage(data.profiles[0]),
  }), [data]);

  return (
    <AppShell>
      {showOverlay ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", background: "rgba(251,251,251,0.82)", backdropFilter: "blur(3px)" }} aria-live="polite" role="status">
          <div className="loading-card">
            <span className="loading-spinner" />
            <strong>Loading</strong>
            <small>กำลังโหลดข้อมูล</small>
          </div>
        </div>
      ) : null}
      <section className="section-head">
        <div>
          <p className="eyebrow">Home</p>
          <h1>V2G Academy Learning Center</h1>
        </div>
      </section>

      {!loading && highlights.length ? <HighlightBanner slides={highlights} /> : null}

      {/* Section tab buttons */}
      {!loading ? (
        <div className="section-tabs">
          {TAB_DEFS.map(({ tab, label }) => {
            const img = normalizeImageUrl(tabImages[tab]);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                className={isActive ? "section-tab active" : "section-tab"}
                onClick={() => setActiveTab(tab)}
                aria-pressed={isActive}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={label} />
                ) : null}
                <div className="section-tab-overlay" />
                <div className="section-tab-content">
                  <span className="section-tab-label">
                    {label}
                    {tab === "news" && unreadCount > 0 ? (
                      <span style={{ marginLeft: 6, background: "var(--error)", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>{unreadCount}</span>
                    ) : null}
                  </span>
                  <span className="section-tab-count">{tabCounts[tab]} รายการ</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Active section heading + tools */}
      {!loading ? (
        <div className="section-content-head">
          <h2>{TAB_DEFS.find((t) => t.tab === activeTab)?.label}</h2>
          <div className="section-tools">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">ทุกหมวด</option>
              {data.categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
            <button type="button" className={viewMode === "gallery" ? "view-btn active" : "view-btn"} onClick={() => setViewMode("gallery")} aria-label="Gallery view">
              <LayoutGrid size={15} />
            </button>
            <button type="button" className={viewMode === "list" ? "view-btn active" : "view-btn"} onClick={() => setViewMode("list")} aria-label="List view">
              <LayoutList size={15} />
            </button>
            {activeTab === "news" && news.length > 4 ? <Button type="button" size="sm" variant="ghost" onClick={() => setListModal("news")}>ดูทั้งหมด</Button> : null}
            {activeTab === "knowledge" && knowledge.length > 4 ? <Button type="button" size="sm" variant="ghost" onClick={() => setListModal("knowledge")}>ดูทั้งหมด</Button> : null}
            {activeTab === "profiles" && profiles.length > 4 ? <Button type="button" size="sm" variant="ghost" onClick={() => setListModal("profiles")}>ดูทั้งหมด</Button> : null}
          </div>
        </div>
      ) : null}

      {/* Active tab content */}
      {activeTab === "news" ? (
        <HomeSection viewMode={viewMode}>
          {news.slice(0, 4).map((item) => {
            const event = parseNewsEvent(item);
            return (
              <button className="card-button" type="button" onClick={() => { readNews.mark(item.id); setSelected({ type: "news", item }); }} key={item.id}>
                <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} />{isNew(item) ? <span style={{ color: "var(--success)", fontSize: 10, fontWeight: 700 }}>NEW</span> : null}{!readNews.has(item.id) ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} /> : null}</>} imageTags={normalizeCategories(item.categories).map(toThaiCategory)}>
                  {event.date || event.time || event.channel ? (
                    <div className="news-event-info">
                      {event.date ? <span>📅 {event.date}</span> : null}
                      {event.time ? <span>⏰ {event.time}</span> : null}
                      {event.channel ? <span>📍 {event.channel}</span> : null}
                    </div>
                  ) : (
                    <p className="line-clamp multiline">{item.body}</p>
                  )}
                </ContentCard>
              </button>
            );
          })}
        </HomeSection>
      ) : null}

      {activeTab === "knowledge" ? (
        <HomeSection viewMode={viewMode}>
          {knowledge.slice(0, 4).map((item) => (
            <button className="card-button" type="button" onClick={() => setSelected({ type: "knowledge", item })} key={item.id}>
              <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span></>} imageTags={normalizeCategories(item.categories).map(toThaiCategory)} imageAspect="16/9">
                <p className="line-clamp two-line">{item.youtubeUrl}</p>
              </ContentCard>
            </button>
          ))}
        </HomeSection>
      ) : null}

      {activeTab === "profiles" ? (
        <HomeSection viewMode={viewMode}>
          {profiles.slice(0, 4).map((item) => (
            <button className="card-button" type="button" onClick={() => setSelected({ type: "profile", item })} key={item.id}>
              <ContentCard
                title={item.name}
                image={getPrimaryImage(item)}
                meta={<><VisibilityBadge value={item.pin || item.visibility} /><span>{item.position}</span></>}
              >
                <p className="line-clamp multiline">{item.bio}</p>
                <span className="muted-link">View Profile</span>
              </ContentCard>
            </button>
          ))}
        </HomeSection>
      ) : null}

      {/* Detail modal */}
      <Modal open={Boolean(selected)} title={selectedTitle(selected)} onClose={() => setSelected(null)}>
        {selected ? <SelectedDetail selected={selected} /> : null}
      </Modal>

      {/* View-more list modal */}
      <Modal open={Boolean(listModal)} title={listTitle(listModal)} onClose={() => setListModal(null)}>
        {listModal === "news" ? (
          <CategoryList items={news} renderItem={(item) => (
            <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "news", item }); }} key={item.id}>
              <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<VisibilityBadge value={item.visibility} />}>
                <p className="line-clamp multiline">{item.body}</p>
              </ContentCard>
            </button>
          )} />
        ) : null}
        {listModal === "knowledge" ? (
          <CategoryList items={knowledge} renderItem={(item) => (
            <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "knowledge", item }); }} key={item.id}>
              <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span></>}>
                <p className="line-clamp two-line">{item.youtubeUrl}</p>
              </ContentCard>
            </button>
          )} />
        ) : null}
        {listModal === "profiles" ? (
          <CategoryList items={profiles} renderItem={(item) => (
            <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "profile", item }); }} key={item.id}>
              <ContentCard
                title={item.name}
                image={getPrimaryImage(item)}
                meta={<><VisibilityBadge value={item.pin || item.visibility} /><span>{item.position}</span></>}
              >
                <p className="line-clamp multiline">{item.bio}</p>
              </ContentCard>
            </button>
          )} />
        ) : null}
      </Modal>
    </AppShell>
  );
}

function listTitle(value: ListModal | null) {
  if (value === "knowledge") return "ลิ้งค์เรียนรู้ทั้งหมด";
  if (value === "profiles") return "ประวัติคนทั้งหมด";
  return "ข่าวสารทั้งหมด";
}

function selectedTitle(selected: SelectedItem | null) {
  if (!selected) return "Detail";
  if (selected.type === "profile") return selected.item.name;
  return selected.item.title;
}

function SelectedDetail({ selected }: { selected: SelectedItem }) {
  if (selected.type === "news") {
    const item = selected.item;
    const event = parseNewsEvent(item);
    return (
      <div className="knowledge-preview">
        <ImageCarousel images={normalizeImages(item.images)} title={item.title} />
        <div className="card-meta"><VisibilityBadge value={item.visibility} /></div>
        {event.date || event.time || event.channel ? (
          <div className="news-event-info" style={{ margin: "6px 0" }}>
            {event.date ? <span>📅 {event.date}</span> : null}
            {event.time ? <span>⏰ {event.time}</span> : null}
            {event.channel ? <span>📍 {event.channel}</span> : null}
          </div>
        ) : null}
        <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <p className="multiline">{item.body}</p>
      </div>
    );
  }
  if (selected.type === "profile") {
    const item = selected.item;
    return (
      <div className="knowledge-preview">
        <div className="card-meta"><VisibilityBadge value={item.visibility} /><span>{item.position}</span></div>
        <p className="multiline">{item.bio}</p>
        <ImageGrid images={normalizeImages(item.images)} title={item.name} />
      </div>
    );
  }
  const item = selected.item;
  return (
    <div className="knowledge-preview">
      <KnowledgeVideoEmbed
        youtubeId={item.youtubeId}
        youtubeUrl={item.youtubeUrl}
        title={item.title}
        onView={() => trackKnowledgeView(item.id)}
      />
      <div className="card-meta">
        <VisibilityBadge value={item.visibility} />
        <span>{item.uploadDate}</span>
        <span>{item.viewCount.toLocaleString()} views</span>
      </div>
      <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <p className="multiline">{item.title}</p>
      <a href={item.youtubeUrl} target="_blank" rel="noreferrer" onClick={() => trackKnowledgeView(item.id)}>
        <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>เปิด YouTube</Button>
      </a>
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? "";
}

function KnowledgeVideoEmbed({
  youtubeId,
  youtubeUrl,
  title,
  onView,
}: {
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  onView: () => void;
}) {
  const videoId = youtubeId || extractYoutubeId(youtubeUrl);

  if (!videoId) {
    return (
      <div style={{ background: "var(--surface-container)", borderRadius: "var(--radius)", padding: "32px 16px", textAlign: "center", color: "var(--secondary)", fontSize: 13, marginBottom: 12 }}>
        ไม่มีลิ้งก์วิดีโอ
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 12 }} onClick={onView}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}

function ImageGrid({ images, title }: { images: string[]; title: string }) {
  if (!images.length) return null;
  return (
    <div className="gallery-grid">
      {images.map((image, index) => (
        <div className="gallery-image" key={`${image}-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizeImageUrl(image)}
            alt={title}
            onError={(e) => e.currentTarget.parentElement?.classList.add("image-placeholder")}
          />
        </div>
      ))}
    </div>
  );
}

function HomeSection({ children, viewMode = "gallery" }: { children: ReactNode; viewMode?: "gallery" | "list" }) {
  return (
    <section className="home-section">
      <div className={viewMode === "list" ? "home-grid home-list" : "home-grid"}>{children}</div>
    </section>
  );
}

function trackKnowledgeView(id: string) {
  fetch(`/api/knowledge/${encodeURIComponent(id)}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
}

function parseNewsEvent(item: News) {
  if (item.eventDate || item.eventTime || item.eventChannel) {
    return {
      date: item.eventDate ?? null,
      time: item.eventTime ?? null,
      channel: item.eventChannel ?? null,
    };
  }
  const body = item.body;
  const dateMatch = body.match(/🗓️?\s*(วัน[^\n]+)/);
  const timeMatch = body.match(/⏰\s*เวลา\s*([^\n]+)/);
  const hasZoom = /zoom\.us/i.test(body);
  const hasTipco = /ทิปโก้/i.test(body);
  return {
    date: dateMatch?.[1]?.trim() ?? null,
    time: timeMatch?.[1]?.trim() ?? null,
    channel: hasZoom ? "Zoom" : hasTipco ? "Tipco Tower" : null,
  };
}

function CategoryList<T extends { id: string; categories?: string[] }>({ items, renderItem }: { items: T[]; renderItem: (item: T) => ReactNode }) {
  const groups = groupByCategory(items);
  return (
    <div className="category-list">
      {groups.map((group) => (
        <section className="category-group" key={group.name}>
          <h3>{group.name}</h3>
          <div className="home-grid modal-list-grid">
            {group.items.map((item) => renderItem(item))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByCategory<T extends { id: string; categories?: string[] }>(items: T[]) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const categories = normalizeCategories(item.categories);
    const names = categories.length ? categories : ["Uncategorized"];
    names.forEach((name) => {
      const rows = map.get(name) ?? [];
      rows.push(item);
      map.set(name, rows);
    });
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, rows]) => ({ name, items: rows }));
}
