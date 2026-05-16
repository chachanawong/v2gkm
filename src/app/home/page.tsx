"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStoredMembership } from "@/lib/client-session";
import { getPrimaryImage, normalizeCategories, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import { useContentBundle } from "@/lib/useContent";
import type { Knowledge, News, Profile } from "@/lib/types";

type SelectedItem =
  | { type: "news"; item: News }
  | { type: "knowledge"; item: Knowledge }
  | { type: "profile"; item: Profile };

type ListModal = "news" | "knowledge" | "profiles";

export default function HomePage() {
  const membership = useStoredMembership();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [listModal, setListModal] = useState<ListModal | null>(null);
  const { data, loading } = useContentBundle(membership);
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

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <p className="eyebrow">Home</p>
          <h1>V2G KM</h1>
        </div>
      </section>
      <div className="toolbar home-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search V2G" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {data.categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </div>
      {loading ? <Skeleton rows={4} /> : null}
      <HomeSection title="Announcements" eyebrow="News" hasMore={news.length > 4} onViewMore={() => setListModal("news")}>
        {news.slice(0, 4).map((item) => (
          <button className="card-button" type="button" onClick={() => setSelected({ type: "news", item })} key={item.id}>
            <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<VisibilityBadge value={item.visibility} />}>
              {normalizeCategories(item.categories).length ? <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : null}
              <p className="line-clamp multiline">{item.body}</p>
            </ContentCard>
          </button>
        ))}
      </HomeSection>
      <HomeSection title="Knowledge" eyebrow="Learning" hasMore={knowledge.length > 4} onViewMore={() => setListModal("knowledge")}>
        {knowledge.slice(0, 4).map((item) => (
          <button className="card-button" type="button" onClick={() => setSelected({ type: "knowledge", item })} key={item.id}>
            <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span></>}>
              <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
              <p className="line-clamp two-line">{item.youtubeUrl}</p>
            </ContentCard>
          </button>
        ))}
      </HomeSection>
      <HomeSection title="Profiles" eyebrow="People" hasMore={profiles.length > 4} onViewMore={() => setListModal("profiles")}>
        {profiles.slice(0, 4).map((item) => (
          <button className="card-button" type="button" onClick={() => setSelected({ type: "profile", item })} key={item.id}>
            <ContentCard title={item.name} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.position}</span></>}>
              <p className="line-clamp multiline">{item.bio}</p>
              <span className="muted-link">View Profile</span>
            </ContentCard>
          </button>
        ))}
      </HomeSection>
      <Modal open={Boolean(selected)} title={selectedTitle(selected)} onClose={() => setSelected(null)}>
        {selected ? <SelectedDetail selected={selected} /> : null}
      </Modal>
      <Modal open={Boolean(listModal)} title={listTitle(listModal)} onClose={() => setListModal(null)}>
        {listModal === "news" ? <CategoryList items={news} renderItem={(item) => (
          <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "news", item }); }} key={item.id}>
            <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<VisibilityBadge value={item.visibility} />}>
              <p className="line-clamp multiline">{item.body}</p>
            </ContentCard>
          </button>
        )} /> : null}
        {listModal === "knowledge" ? <CategoryList items={knowledge} renderItem={(item) => (
          <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "knowledge", item }); }} key={item.id}>
            <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span></>}>
              <p className="line-clamp two-line">{item.youtubeUrl}</p>
            </ContentCard>
          </button>
        )} /> : null}
        {listModal === "profiles" ? <CategoryList items={profiles} renderItem={(item) => (
          <button className="card-button" type="button" onClick={() => { setListModal(null); setSelected({ type: "profile", item }); }} key={item.id}>
            <ContentCard title={item.name} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.position}</span></>}>
              <p className="line-clamp multiline">{item.bio}</p>
            </ContentCard>
          </button>
        )} /> : null}
      </Modal>
    </AppShell>
  );
}

function listTitle(value: ListModal | null) {
  if (value === "knowledge") return "All Knowledge";
  if (value === "profiles") return "All Profiles";
  return "All News";
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
        <img src={normalizeImageUrl(item.thumbnail)} alt={item.title} onError={(event) => event.currentTarget.parentElement?.classList.add("image-placeholder")} />
      </div>
      <div className="card-meta"><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span><span>{item.viewCount.toLocaleString()} views</span></div>
      <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <p className="multiline">{item.title}</p>
      <a href={item.youtubeUrl} target="_blank" rel="noreferrer" onClick={() => trackKnowledgeView(item.id)}>
        <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>Open YouTube</Button>
      </a>
    </div>
  );
}

function ImageGrid({ images, title }: { images: string[]; title: string }) {
  console.log("[IMAGE GRID]", {
    title,
    images,
    normalizedImages: images.map((image) => normalizeImageUrl(image)),
  });

  if (!images.length) return null;

  return (
    <div className="gallery-grid">
      {images.map((image, index) => {
        const src = normalizeImageUrl(image);

        console.log("[IMAGE GRID ITEM]", {
          title,
          rawImage: image,
          src,
        });

        return (
          <div className="gallery-image" key={`${image}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={title}
              onError={(event) => {
                console.error("[IMAGE LOAD FAILED]", {
                  src,
                  rawImage: image,
                  title,
                });

                event.currentTarget.parentElement?.classList.add("image-placeholder");
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function HomeSection({ title, eyebrow, children, hasMore, onViewMore }: { title: string; eyebrow: string; children: ReactNode; hasMore?: boolean; onViewMore?: () => void }) {
  return (
    <section className="home-section">
      <div className="section-head slim">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {hasMore ? <Button type="button" size="sm" variant="ghost" onClick={onViewMore}>View More</Button> : null}
      </div>
      <div className="home-grid">{children}</div>
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
