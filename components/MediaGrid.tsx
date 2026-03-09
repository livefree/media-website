import { MediaCard } from "./MediaCard";

import type { BrowseMediaCard } from "../types/media";

type MediaGridProps = {
  items: BrowseMediaCard[];
  title: string;
};

export function MediaGrid({ items, title }: MediaGridProps) {
  return (
    <ul className="media-grid" aria-label={title}>
      {items.map((item) => (
        <li key={item.id} className="media-grid-item">
          <MediaCard item={item} />
        </li>
      ))}
    </ul>
  );
}
