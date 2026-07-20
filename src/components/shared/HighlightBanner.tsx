"use client";

import { useEffect, useState } from "react";
import { normalizeImageUrl } from "@/lib/normalize";

export type HighlightSlide = {
  id: string;
  title: string;
  image?: string;
  eyebrow?: string;
  onClick?: () => void;
};

const ROTATE_MS = 5000;

export function HighlightBanner({ slides }: { slides: HighlightSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  // Clamp during render in case the slide list shrank since the last interaction.
  const current = count ? active % count : 0;
  const canNavigate = count > 1;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;

  return (
    <section
      className="highlight-banner"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="highlight-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => {
          const image = normalizeImageUrl(slide.image);
          return (
            <button
              type="button"
              className="highlight-slide"
              key={slide.id}
              onClick={slide.onClick}
              tabIndex={slide.onClick ? 0 : -1}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={slide.title} onError={(event) => event.currentTarget.parentElement?.classList.add("image-placeholder")} />
              ) : (
                <div className="highlight-fallback" />
              )}
              <div className="highlight-caption">
                {slide.eyebrow ? <span className="highlight-eyebrow">{slide.eyebrow}</span> : null}
                <h2>{slide.title}</h2>
              </div>
            </button>
          );
        })}
      </div>
      {canNavigate ? (
        <div className="highlight-dots" role="tablist" aria-label="Highlights">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={index === current ? "highlight-dot active" : "highlight-dot"}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === current}
              role="tab"
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
