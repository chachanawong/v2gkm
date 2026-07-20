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
  imageAspect,
  imageFit,
  titleAction,
  onClick,
}: {
  title: string;
  image?: string;
  href?: string;
  meta?: ReactNode;
  children?: ReactNode;
  imageAspect?: string;
  imageFit?: "cover" | "contain";
  titleAction?: ReactNode;
  onClick?: () => void;
}) {
  const normalizedImage = normalizeImageUrl(image);
  const [imageFailed, setImageFailed] = useState(false);
  const body = (
    <article
      className={onClick ? "content-card content-card-clickable" : "content-card"}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {normalizedImage && !imageFailed ? (
        <div className="card-image" style={imageAspect ? { aspectRatio: imageAspect } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedImage}
            alt={title}
            onError={() => setImageFailed(true)}
            style={imageFit ? { objectFit: imageFit } : undefined}
          />
        </div>
      ) : normalizedImage ? <div className="card-image image-placeholder" /> : null}
      <div className="card-body">
        <div className="card-title-row">
          <h3>{title}</h3>
          {titleAction ? <div className="card-title-action">{titleAction}</div> : null}
        </div>
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
