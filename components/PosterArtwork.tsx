"use client";

import { useState } from "react";

import type { MediaType } from "../types/media";

type PosterVariant = MediaType | "list";

const knownBrokenPosterHosts = new Set(["static.example.com"]);

const posterVariantLabels: Record<PosterVariant, string> = {
  movie: "Movie",
  series: "Series",
  anime: "Anime",
  list: "List",
};

function shouldRenderFallback(src?: string) {
  if (!src || src.trim().length === 0) {
    return true;
  }

  try {
    const url = new URL(src, "http://localhost");
    return knownBrokenPosterHosts.has(url.hostname);
  } catch {
    return false;
  }
}

function getPosterMonogram(title: string) {
  const compactTitle = title.replace(/\s+/g, "").trim();

  if (!compactTitle) {
    return "MA";
  }

  return Array.from(compactTitle).slice(0, 2).join("").toUpperCase();
}

export function PosterArtwork({
  src,
  alt,
  title,
  variant,
  className,
  loading = "lazy",
}: {
  src?: string;
  alt: string;
  title: string;
  variant: PosterVariant;
  className: string;
  loading?: "eager" | "lazy";
}) {
  const [didFail, setDidFail] = useState(false);
  const showFallback = didFail || shouldRenderFallback(src);

  if (showFallback) {
    return (
      <div className={`${className} poster-fallback`} data-variant={variant} role="img" aria-label={alt}>
        <span className="poster-fallback-badge">{posterVariantLabels[variant]}</span>
        <span className="poster-fallback-monogram" aria-hidden="true">
          {getPosterMonogram(title)}
        </span>
        <span className="poster-fallback-title">{title}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} loading={loading} onError={() => setDidFail(true)} />;
}
