import Link from "next/link";

import type { MediaEpisodeOption } from "../../types/media";
import styles from "../detail/detail-page.module.css";

type EpisodeSelection = MediaEpisodeOption & {
  href: string;
  isActive: boolean;
};

export function EpisodeSelector({ episodes }: { episodes: EpisodeSelection[] }) {
  if (episodes.length === 0) {
    return null;
  }

  return (
    <section className={styles.selectorBlock} aria-labelledby="episode-selector-title">
      <div className={styles.selectorLabelRow}>
        <span id="episode-selector-title" className={styles.selectorLabel}>
          选集：
        </span>
      </div>

      <div className={styles.selectorTabs}>
        {episodes.map((episode) => (
          <Link
            key={episode.id}
            href={episode.href}
            className={`${styles.selectorButton} ${episode.isActive ? styles.selectorButtonActive : ""}`}
            aria-current={episode.isActive ? "page" : undefined}
          >
            {episode.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
