import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/Badge";
import { findContent } from "@/lib/content";
import { normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfileDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = (await findContent("profiles", id)) as Profile | null;
  const images = normalizeImages(item?.images);

  return (
    <AppShell>
      <article className="profile-detail">
        <Link href="/profiles" className="muted-link">Back</Link>
        {item ? (
          <>
            {images[0] ? (
              <div className="portrait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={normalizeImageUrl(images[0])} alt={item.name} />
              </div>
            ) : null}
            <h1>{item.name}</h1>
            <Badge tone="blue">{item.position}</Badge>
            <p className="multiline">{item.bio}</p>
            <div className="gallery-grid">
              {images.map((image, index) => (
                <div className="gallery-image" key={`${image}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={normalizeImageUrl(image)} alt={item.name} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <h1>Profile not found</h1>
        )}
      </article>
    </AppShell>
  );
}
