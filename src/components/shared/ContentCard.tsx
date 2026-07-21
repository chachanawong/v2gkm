"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
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
      {normalizedImage ? (
        <CardImage
          key={normalizedImage}
          src={normalizedImage}
          alt={title}
          imageAspect={imageAspect}
          imageFit={imageFit}
        />
      ) : null}
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

function CardImage({
  src,
  alt,
  imageAspect,
  imageFit,
}: {
  src: string;
  alt: string;
  imageAspect?: string;
  imageFit?: "cover" | "contain";
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageStyle: CSSProperties | undefined = imageFit ? { objectFit: imageFit } : undefined;

  if (imageFailed) {
    return <div className="card-image image-placeholder" style={imageAspect ? { aspectRatio: imageAspect } : undefined} />;
  }

  return (
    <div className={imageLoaded ? "card-image is-loaded" : "card-image"} style={imageAspect ? { aspectRatio: imageAspect } : undefined}>
      {!imageLoaded ? <span className="skeleton-wave card-image-skeleton" aria-hidden="true" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageFailed(true)}
        style={imageStyle}
      />
    </div>
  );
}

export function VisibilityBadge({ value }: { value: string }) {
  return <Badge tone="dark">{value}</Badge>;
}
