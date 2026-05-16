import Link from "next/link";
import { findContent } from "@/lib/content";
import { listSheet } from "@/lib/google-sheets";
import { getPrimaryImage, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import type { Knowledge, News, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokens = await listSheet("preview_tokens");
  const preview = tokens.find((item) => item.token === token && new Date(item.expiresAt) > new Date());
  const item = preview ? preview.data ?? await findContent(preview.resourceType, preview.resourceId) : null;

  if (!preview || !item) {
    return (
      <main className="content-wrap">
        <section className="panel">
          <h1>Preview unavailable</h1>
          <p className="multiline">Token is invalid or expired.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="content-wrap">
      <article className="detail-page">
        <Link href="/" className="preview-brand">V2G KM Preview</Link>
        <span className="badge badge-blue">{preview.resourceType} preview</span>
        {preview.resourceType === "knowledge" ? <KnowledgePreview item={item as Knowledge} /> : null}
        {preview.resourceType === "news" ? <NewsPreview item={item as News} /> : null}
        {preview.resourceType === "profiles" ? <ProfilePreview item={item as Profile} /> : null}
      </article>
    </main>
  );
}

function KnowledgePreview({ item }: { item: Knowledge }) {
  const image = getPrimaryImage(item);
  return (
    <>
      {image ? <SafeImage src={image} alt={item.title} className="card-image" /> : null}
      <h1>{item.title}</h1>
      <p className="card-meta">{item.uploadDate} · {item.viewCount.toLocaleString()} views</p>
      <a className="btn btn-secondary btn-sm" href={item.youtubeUrl} target="_blank" rel="noreferrer">Open YouTube</a>
    </>
  );
}

function NewsPreview({ item }: { item: News }) {
  return (
    <>
      <h1>{item.title}</h1>
      <p className="multiline">{item.body}</p>
      <ImageGallery images={normalizeImages(item.images)} title={item.title} />
    </>
  );
}

function ProfilePreview({ item }: { item: Profile }) {
  const images = normalizeImages(item.images);
  return (
    <>
      {images[0] ? (
        <div className="portrait">
          <img src={normalizeImageUrl(images[0])} alt={item.name} />
        </div>
      ) : null}
      <h1>{item.name}</h1>
      <span className="badge badge-blue">{item.position}</span>
      <p className="multiline">{item.bio}</p>
      <ImageGallery images={images} title={item.name} />
    </>
  );
}

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  return (
    <div className="gallery-grid">
      {images.map((image, index) => (
        <div className="gallery-image" key={`${image}-${index}`}>
          <img src={normalizeImageUrl(image)} alt={title} />
        </div>
      ))}
    </div>
  );
}

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={normalizeImageUrl(src)} alt={alt} />
    </div>
  );
}
