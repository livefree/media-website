import Link from "next/link";

import type { BrowseMediaCard } from "../types/media";

export function MediaCard({ item }: { item: BrowseMediaCard }) {
  return (
    <article className="media-card" data-tone={item.badge.tone}>
      <Link href={item.href} className="media-poster-link">
        <div className="media-poster">
          <img className="poster-image" src={item.posterUrl} alt={`${item.title} poster`} loading="lazy" />
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
          <Link href={item.href} className="media-title-link">
            {item.title}
          </Link>
        </h3>
        <p className="media-meta">
          {item.yearLabel} · {item.typeLabel}
        </p>
        <div className="media-stats" aria-label="Availability">
          {item.stats.slice(0, 3).map((stat) => (
            <span key={stat.label}>
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
