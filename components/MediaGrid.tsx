import { MediaCard } from "./MediaCard";

type MediaGridItem = {
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

type MediaGridProps = {
  items: MediaGridItem[];
};

export function MediaGrid({ items }: MediaGridProps) {
  return (
    <ul className="media-grid" aria-label="Featured titles">
      {items.map((item) => (
        <li key={item.title} className="media-grid-item">
          <MediaCard {...item} />
        </li>
      ))}
    </ul>
  );
}
