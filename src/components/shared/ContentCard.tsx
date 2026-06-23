"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { normalizeImageUrl } from "@/lib/normalize";
import { Badge } from "../ui/Badge";

export function ContentCard({
  title,
  image,
  href,
  meta,
  children,
  imageTags,
  imageAspect,
  imageFit,
}: {
  title: string;
  image?: string;
  href?: string;
  meta?: ReactNode;
  children?: ReactNode;
  imageTags?: string[];
  imageAspect?: string;
  imageFit?: "cover" | "contain";
}) {
  const normalizedImage = normalizeImageUrl(image);
  const [imageFailed, setImageFailed] = useState(false);
  const body = (
    <article className="content-card">
      {normalizedImage && !imageFailed ? (
        <div className="card-image" style={imageAspect ? { aspectRatio: imageAspect } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedImage}
            alt={title}
            onError={() => setImageFailed(true)}
            style={imageFit ? { objectFit: imageFit } : undefined}
          />
          {imageTags?.length ? (
            <div className="card-image-tags">
              {imageTags.slice(0, 2).map((tag) => (
                <span className="card-image-tag" key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : normalizedImage ? <div className="card-image image-placeholder" /> : null}
      <div className="card-body">
        <h3>{title}</h3>
        {meta ? <div className="card-meta">{meta}</div> : null}
        {children}
      </div>
    </article>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function VisibilityBadge({ value }: { value: string }) {
  return <Badge tone="dark">{value}</Badge>;
}
