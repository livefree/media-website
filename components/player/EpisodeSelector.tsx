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
    <section className={styles.episodesCard} aria-labelledby="episode-selector-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Episode selector</p>
          <h3 id="episode-selector-title" className={styles.sectionTitle}>
            Switch the active episode before choosing a playback mirror.
          </h3>
        </div>
      </div>

      <div className={styles.episodeGrid}>
        {episodes.map((episode) => (
          <Link
            key={episode.id}
            href={episode.href}
            className={`${styles.episodeLink} ${episode.isActive ? styles.episodeLinkActive : ""}`}
            aria-current={episode.isActive ? "page" : undefined}
          >
            <span className={styles.episodeCopy}>
              <span>
                S{episode.seasonNumber} · E{episode.episodeNumber}
              </span>
              <span>{episode.title}</span>
              <span className={styles.episodeMeta}>
                {episode.streamCount} streams · {episode.downloadCount} downloads
                {episode.runtimeMinutes ? ` · ${episode.runtimeMinutes} min` : ""}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
