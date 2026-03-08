import type { BrowseMediaCard } from "../types/media";

export function MediaCard({ item }: { item: BrowseMediaCard }) {
  return (
    <article className="media-card" data-tone={item.badge.tone}>
      <div className="media-poster">
        <img className="poster-image" src={item.posterUrl} alt={`${item.title} poster`} loading="lazy" />
        <div className="poster-badge badge-top-left">{item.badge.label}</div>
        <div className="poster-badge badge-top-right" aria-label={`Rating ${item.ratingLabel}`}>
          {item.ratingValue.toFixed(1)}
        </div>
        <div className="poster-badge badge-bottom-right">{item.statusLabel}</div>
        <div className="poster-surface">
          <span className="poster-format">{item.typeLabel}</span>
          <p className="poster-title">{item.title}</p>
          <p className="poster-subtitle">{item.originalTitle ?? item.genres.slice(0, 2).join(" / ")}</p>
        </div>
      </div>

      <div className="media-copy">
        <h3>{item.title}</h3>
        <p className="media-meta">
          {item.yearLabel} · {item.typeLabel}
        </p>
        <p className="media-availability">{item.availabilityLabel}</p>
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
