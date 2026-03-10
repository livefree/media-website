import Link from "next/link";

import type { BrowseMediaCard } from "../types/media";
import { PosterArtwork } from "./PosterArtwork";

export function MediaCard({ item }: { item: BrowseMediaCard }) {
  const publicEntryHref = item.canonicalWatchHref || item.href;

  return (
    <article className="media-card" data-tone={item.badge.tone}>
      <Link href={publicEntryHref} className="media-poster-link">
        <div className="media-poster">
          <PosterArtwork
            className="poster-image"
            src={item.posterUrl}
            alt={`${item.title} poster`}
            title={item.title}
            variant={item.type}
          />
          <div className="poster-badge badge-top-left">{item.badge.label}</div>
          {item.ratingValue > 0 ? (
            <div className="poster-badge badge-top-right" aria-label={`Rating ${item.ratingLabel}`}>
              {item.ratingValue.toFixed(1)}
            </div>
          ) : null}
          <div className="poster-badge badge-bottom-right">{item.statusLabel}</div>
        </div>
      </Link>

      <div className="media-copy">
        <h3 className="media-title">
          <Link href={publicEntryHref} className="media-title-link">
            {item.title}
          </Link>
        </h3>
        {item.type !== "movie" && item.episodeCountLabel ? (
          <p className="media-supporting-line">{item.episodeCountLabel}</p>
        ) : null}
      </div>
    </article>
  );
}
