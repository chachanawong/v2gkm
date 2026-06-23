"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ContentCard, VisibilityBadge } from "@/components/shared/ContentCard";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStoredMembership } from "@/lib/client-session";
import { getPrimaryImage, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import { useContent } from "@/lib/useContent";
import type { Profile } from "@/lib/types";

export default function ProfilesPage() {
  const membership = useStoredMembership();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const { items, loading } = useContent<Profile>("profiles", membership);
  const positions = useMemo(() => [...new Set(items.map((item) => item.position).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    return items
      .filter((item) => `${item.name} ${item.bio} ${item.position}`.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => position === "all" || item.position === position);
  }, [items, position, query]);

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <p className="eyebrow">Profiles</p>
          <h1>Member Profiles</h1>
        </div>
      </div>
      <div className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search profiles" />
        <select value={position} onChange={(event) => setPosition(event.target.value)}>
          <option value="all">All positions</option>
          {positions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {loading ? <Skeleton rows={4} /> : null}
      <div className="profile-grid">
        {filtered.map((item) => (
          <button className="card-button" type="button" onClick={() => setSelected(item)} key={item.id}>
            <ContentCard
              title={item.name}
              image={getPrimaryImage(item)}
              imageAspect="3/4"
              imageFit="contain"
              meta={<><VisibilityBadge value={item.pin || item.visibility} /><span>{item.position}</span></>}
            >
              <p className="line-clamp">{item.bio}</p>
              <span className="muted-link">View Profile</span>
            </ContentCard>
          </button>
        ))}
      </div>
      <Modal open={Boolean(selected)} title={selected?.name ?? "Profile"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="knowledge-preview profile-preview">
            <div className="card-meta"><VisibilityBadge value={selected.visibility} /><span>{selected.position}</span></div>
            <p className="multiline">{selected.bio}</p>
            <div className="gallery-grid">
              {normalizeImages(selected.images).map((image, index) => (
                <div className="gallery-image" key={`${image}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={normalizeImageUrl(image)} alt={selected.name} onError={(event) => event.currentTarget.parentElement?.classList.add("image-placeholder")} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
