"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeImageUrl } from "@/lib/normalize";

export function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => { setIndex(0); }, [images]);

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <div className="carousel-single">
        <img src={normalizeImageUrl(images[0])} alt={title} style={{ width: "100%", display: "block" }} onError={(e) => e.currentTarget.style.display = "none"} />
      </div>
    );
  }

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (startX.current === null) return;
          const diff = startX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
          startX.current = null;
        }}
      >
        <img
          key={images[index]}
          src={normalizeImageUrl(images[index])}
          alt={`${title} ${index + 1}`}
          style={{ width: "100%", display: "block" }}
          onError={(e) => e.currentTarget.style.display = "none"}
        />
      </div>
      <button type="button" className="carousel-arrow carousel-prev" onClick={prev} aria-label="Previous">‹</button>
      <button type="button" className="carousel-arrow carousel-next" onClick={next} aria-label="Next">›</button>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`carousel-dot${i === index ? " active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
