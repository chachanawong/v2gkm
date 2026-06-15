import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { findContent } from "@/lib/content";
import { normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import type { News } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = (await findContent("news", id)) as News | null;
  const images = normalizeImages(item?.images);

  return (
    <AppShell>
      <article className="detail-page">
        <Link href="/home" className="muted-link">Back</Link>
        <h1>{item?.title ?? "News not found"}</h1>
        <p className="multiline">{item?.body}</p>
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div className="gallery-image" key={`${image}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeImageUrl(image)} alt={item?.title ?? "News image"} />
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
