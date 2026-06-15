"use client";

import { ExternalLink, LayoutGrid, LayoutList } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { HighlightBanner } from "@/components/shared/HighlightBanner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
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
      <section className="section-head">
        <div>
          <p className="eyebrow">Home</p>
          <h1>V2G Academy Learning Center</h1>
        </div>
      </section>

      {loading ? <Skeleton rows={4} /> : null}
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
          {news.slice(0, 4).map((item) => (
            <button className="card-button" type="button" onClick={() => { readNews.mark(item.id); setSelected({ type: "news", item }); }} key={item.id}>
              <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} />{isNew(item) ? <span style={{ color: "var(--success)", fontSize: 10, fontWeight: 700 }}>NEW</span> : null}{!readNews.has(item.id) ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} /> : null}</>} imageTags={normalizeCategories(item.categories).map(toThaiCategory)}>
                <p className="line-clamp multiline">{item.body}</p>
              </ContentCard>
            </button>
          ))}
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
              <ContentCard title={item.name} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.position}</span></>}>
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
              <ContentCard title={item.name} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.position}</span></>}>
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
    return (
      <div className="knowledge-preview">
        <div className="card-meta"><VisibilityBadge value={item.visibility} /></div>
        <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <p className="multiline">{item.body}</p>
        <ImageGrid images={normalizeImages(item.images)} title={item.title} />
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
      <div className="card-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={normalizeImageUrl(item.thumbnail)} alt={item.title} onError={(e) => e.currentTarget.parentElement?.classList.add("image-placeholder")} />
      </div>
      <div className="card-meta">
        <VisibilityBadge value={item.visibility} />
        <span>{item.uploadDate}</span>
        <span>{item.viewCount.toLocaleString()} views</span>
      </div>
      <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <p className="multiline">{item.title}</p>
      <a href={item.youtubeUrl} target="_blank" rel="noreferrer" onClick={() => trackKnowledgeView(item.id)}>
        <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>Open YouTube</Button>
      </a>
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
