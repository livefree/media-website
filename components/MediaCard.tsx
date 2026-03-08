import type { CSSProperties } from "react";

type MediaCardProps = {
  title: string;
  subtitle: string;
  year: number;
  rating: string;
  format: string;
  badge: string;
  availability: string;
  streams: number;
  downloads: number;
  tone: string;
};

export function MediaCard({
  title,
  subtitle,
  year,
  rating,
  format,
  badge,
  availability,
  streams,
  downloads,
  tone,
}: MediaCardProps) {
  const style = {
    "--poster-tone": tone,
  } as CSSProperties;

  return (
    <article className="media-card" style={style}>
      <div className="media-poster">
        <div className="poster-badge badge-top-left">{badge}</div>
        <div className="poster-badge badge-top-right" aria-label={`Rating ${rating}`}>
          {rating}
        </div>
        <div className="poster-badge badge-bottom-right">{availability}</div>
        <div className="poster-surface">
          <span className="poster-format">{format}</span>
          <p className="poster-title">{title}</p>
          <p className="poster-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="media-copy">
        <h3>{title}</h3>
        <p className="media-meta">
          {year} · {format}
        </p>
        <div className="media-stats" aria-label="Availability">
          <span>Online: {streams}</span>
          <span>Drive: {downloads}</span>
        </div>
      </div>
    </article>
  );
}
