"use client";

import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStoredMembership } from "@/lib/client-session";
import { getPrimaryImage, normalizeCategories, normalizeImageUrl } from "@/lib/normalize";
import { useContent } from "@/lib/useContent";
import type { Category, Knowledge } from "@/lib/types";

export default function KnowledgePage() {
  const membership = useStoredMembership();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Knowledge | null>(null);
  const { items, loading } = useContent<Knowledge>("knowledge", membership);
  const { items: categories } = useContent<Category>("categories", membership);
  const filtered = useMemo(() => {
    return [...items]
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => category === "all" || normalizeCategories(item.categories).includes(category))
      .filter((item) => visibility === "all" || item.visibility === visibility)
      .sort((a, b) => (sort === "views" ? b.viewCount - a.viewCount : b.uploadDate.localeCompare(a.uploadDate)));
  }, [category, items, query, sort, visibility]);

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <p className="eyebrow">Knowledge</p>
          <h1>Learning Library</h1>
        </div>
      </div>
      <div className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          <option value="all">All visibility</option>
          <option value="general">general</option>
          {membership === "silver" || membership === "platinum" ? <option value="silver">silver</option> : null}
          {membership === "platinum" ? <option value="platinum">platinum</option> : null}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest</option>
          <option value="views">Most viewed</option>
        </select>
      </div>
      {loading ? <Skeleton rows={5} /> : null}
      <div className="knowledge-grid">
        {filtered.map((item) => (
          <button className="card-button" type="button" onClick={() => setSelected(item)} key={item.id}>
            <ContentCard title={item.title} image={getPrimaryImage(item)} meta={<><VisibilityBadge value={item.visibility} /><span>{item.uploadDate}</span><span>{item.viewCount.toLocaleString()} views</span></>}>
            <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <span className="muted-link">View Details</span>
            </ContentCard>
          </button>
        ))}
      </div>
      <Modal open={Boolean(selected)} title={selected?.title ?? "Knowledge"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="knowledge-preview">
            <div className="card-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeImageUrl(selected.thumbnail)} alt={selected.title} onError={(event) => event.currentTarget.parentElement?.classList.add("image-placeholder")} />
            </div>
            <div className="card-meta"><VisibilityBadge value={selected.visibility} /><span>{selected.uploadDate}</span><span>{selected.viewCount.toLocaleString()} views</span></div>
            <div className="tag-row">{normalizeCategories(selected.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <p className="multiline">{selected.title}</p>
            <a href={selected.youtubeUrl} target="_blank" rel="noreferrer" onClick={() => trackKnowledgeView(selected.id)}>
              <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>Open YouTube</Button>
            </a>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}

function trackKnowledgeView(id: string) {
  fetch(`/api/knowledge/${encodeURIComponent(id)}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
}
